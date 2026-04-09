const jwt       = require('jsonwebtoken');
const mongoose  = require('mongoose');
const Admin     = require('../models/Admin');
const Complaint = require('../models/Complaint');
const { sendStatusUpdateEmail } = require('../utils/mailer');
const { uploadToCloudinary } = require('../utils/cloudinary');

const DEPARTMENTS   = ['Roads & Infrastructure','Sanitation','Electrical','Water Supply','Drainage','General'];
const VALID_STATUSES = ['submitted','under_review','assigned','in_progress','resolved','rejected'];

function generateToken(admin) {
  return jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
}

async function login(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database is unavailable. Please try again shortly.' });
    }

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!admin) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!admin.isActive) return res.status(403).json({ error: 'Account deactivated.' });
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = generateToken(admin);
    res.json({ success: true, token, admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role, department: admin.department } });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Login failed.' });
  }
}

async function getAllComplaints(req, res) {
  try {
    const { status, category, startDate, endDate, search, page = 1 } = req.query;
    const PAGE_SIZE = 20;
    const skip = (parseInt(page) - 1) * PAGE_SIZE;
    const filter = {};
    if (status && VALID_STATUSES.includes(status)) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23,59,59,999); filter.createdAt.$lte = end; }
    }
    if (search && search.trim().length > 0) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [{ complaintNo: re }, { address: re }, { description: re }];
    }
    const [complaints, total] = await Promise.all([
      Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).select('-statusLogs -adminNote').lean(),
      Complaint.countDocuments(filter),
    ]);
    res.json({ success: true, complaints, pagination: { total, page: parseInt(page), pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) } });
  } catch (err) {
    console.error('[getAllComplaints]', err);
    res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
}

async function getComplaintById(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id).lean();
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    if (complaint.statusLogs) complaint.statusLogs.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
    res.json({ success: true, complaint });
  } catch (err) {
    console.error('[getComplaintById]', err);
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid complaint ID.' });
    res.status(500).json({ error: 'Failed to fetch complaint.' });
  }
}

async function updateComplaintStatus(req, res) {
  try {
    const { newStatus, adminNote, publicNote, resolutionRemarks } = req.body;
    if (!newStatus || !VALID_STATUSES.includes(newStatus)) return res.status(400).json({ error: 'Invalid status.' });
    if (newStatus === 'resolved' && !req.file && !resolutionRemarks) {
       // Just loosely checking, maybe resolutionRemarks is what they asked for "description admin should add"
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    let resolutionImageUrl = complaint.resolutionImageUrl;
    let resolutionPublicId = complaint.resolutionPublicId;

    if (newStatus === 'resolved' && req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'municipal-complaints/resolved');
      resolutionImageUrl = result.imageUrl;
      resolutionPublicId = result.publicId;
    }

    const oldStatus = complaint.status;
    complaint.status     = newStatus;
    complaint.adminNote  = adminNote  ? adminNote.trim()   : complaint.adminNote;
    complaint.publicNote = publicNote ? publicNote.trim()  : complaint.publicNote;
    
    if (resolutionRemarks) {
      complaint.resolutionRemarks = resolutionRemarks.trim();
    }
    if (resolutionImageUrl) {
      complaint.resolutionImageUrl = resolutionImageUrl;
      complaint.resolutionPublicId = resolutionPublicId;
    }

    complaint.statusLogs.push({ oldStatus, newStatus, changedBy: req.admin.name, note: adminNote ? adminNote.trim() : null, changedAt: new Date() });
    await complaint.save();
    if (complaint.reporterEmail) {
      await sendStatusUpdateEmail({ to: complaint.reporterEmail, complaintNo: complaint.complaintNo, status: newStatus, publicNote: complaint.publicNote, trackUrl: `${process.env.CLIENT_URL}/track/${complaint.complaintNo}`, category: complaint.category });
    }
    res.json({ success: true, message: `Status updated to ${newStatus}`, complaint: { _id: complaint._id, complaintNo: complaint.complaintNo, status: complaint.status, adminNote: complaint.adminNote, publicNote: complaint.publicNote, statusLogs: complaint.statusLogs, resolutionImageUrl: complaint.resolutionImageUrl, resolutionRemarks: complaint.resolutionRemarks } });
  } catch (err) {
    console.error('[updateComplaintStatus]', err);
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid complaint ID.' });
    res.status(500).json({ error: 'Failed to update status.' });
  }
}

async function assignComplaint(req, res) {
  try {
    const { department } = req.body;
    if (!department || !DEPARTMENTS.includes(department)) return res.status(400).json({ error: 'Invalid department.' });
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    complaint.department = department;
    if (complaint.status === 'submitted') {
      complaint.statusLogs.push({ oldStatus: complaint.status, newStatus: 'assigned', changedBy: req.admin.name, note: `Assigned to ${department}`, changedAt: new Date() });
      complaint.status = 'assigned';
    }
    await complaint.save();
    res.json({ success: true, message: `Assigned to ${department}`, department: complaint.department, status: complaint.status });
  } catch (err) {
    console.error('[assignComplaint]', err);
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid complaint ID.' });
    res.status(500).json({ error: 'Failed to assign complaint.' });
  }
}

async function getStats(req, res) {
  try {
    const now = new Date();
    const todayStart     = new Date(now); todayStart.setHours(0,0,0,0);
    const thirtyDaysAgo  = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
    const fourteenDaysAgo = new Date(now); fourteenDaysAgo.setDate(now.getDate() - 14);

    const [total, pending, inProgress, resolvedToday, byCategoryRaw, dailyVolumeRaw, recentComplaints] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ['submitted','under_review'] } }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'resolved', updatedAt: { $gte: todayStart } }),
      Complaint.aggregate([{ $match: { createdAt: { $gte: thirtyDaysAgo } } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Complaint.aggregate([{ $match: { createdAt: { $gte: fourteenDaysAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Complaint.find().sort({ createdAt: -1 }).limit(10).select('complaintNo category address status createdAt').lean(),
    ]);

    const byCategory = byCategoryRaw.map((i) => ({ category: i._id, count: i.count }));
    const dailyMap   = {};
    dailyVolumeRaw.forEach((i) => { dailyMap[i._id] = i.count; });
    const dailyVolume = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyVolume.push({ date: dateStr, count: dailyMap[dateStr] || 0 });
    }

    res.json({ success: true, stats: { total, pending, inProgress, resolvedToday, byCategory, dailyVolume, recentComplaints } });
  } catch (err) {
    console.error('[getStats]', err);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
}

async function getMapData(req, res) {
  try {
    const complaints = await Complaint.find().select('_id complaintNo category status latitude longitude address createdAt').sort({ createdAt: -1 }).lean();
    res.json({ success: true, complaints, total: complaints.length });
  } catch (err) {
    console.error('[getMapData]', err);
    res.status(500).json({ error: 'Failed to fetch map data.' });
  }
}

async function getDepartments(req, res) {
  res.json({ success: true, departments: DEPARTMENTS });
}

module.exports = { login, getAllComplaints, getComplaintById, updateComplaintStatus, assignComplaint, getStats, getMapData, getDepartments };
