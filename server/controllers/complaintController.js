const Complaint              = require('../models/Complaint');
const { uploadToCloudinary } = require('../utils/cloudinary');
const generateComplaintNo    = require('../utils/generateComplaintNo');

const CATEGORIES = ['Road','Garbage','Streetlight','Drainage','Water','Other'];

async function getCategories(req, res) {
  res.json({ categories: CATEGORIES });
}

async function submitComplaint(req, res) {
  try {
    const { category, description, latitude, longitude, address,
            reporterName, reporterEmail, reporterPhone } = req.body;

    const errors = [];
    if (!category || !CATEGORIES.includes(category)) errors.push('Valid category is required');
    if (!description || description.trim().length < 20) errors.push('Description must be at least 20 characters');
    if (!latitude || isNaN(parseFloat(latitude))) errors.push('Valid latitude is required');
    if (!longitude || isNaN(parseFloat(longitude))) errors.push('Valid longitude is required');
    if (!address || address.trim().length === 0) errors.push('Address is required');
    if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) errors.push('Invalid email format');
    if (errors.length > 0) return res.status(400).json({ errors });

    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'municipal-complaints');
        uploadedImages.push(result);
      }
    }

    const complaintNo = await generateComplaintNo();
    const complaint = await Complaint.create({
      complaintNo,
      category      : category.trim(),
      description   : description.trim(),
      status        : 'submitted',
      latitude      : parseFloat(latitude),
      longitude     : parseFloat(longitude),
      address       : address.trim(),
      images        : uploadedImages,
      statusLogs    : [{ oldStatus: '', newStatus: 'submitted', changedBy: 'system', note: 'Complaint submitted by citizen', changedAt: new Date() }],
      reporterName  : reporterName  ? reporterName.trim()  : null,
      reporterEmail : reporterEmail ? reporterEmail.trim().toLowerCase() : null,
      reporterPhone : reporterPhone ? reporterPhone.trim() : null,
    });

    res.status(201).json({ success: true, complaintNo: complaint.complaintNo, _id: complaint._id, message: 'Complaint submitted successfully' });
  } catch (err) {
    console.error('[submitComplaint]', err);
    res.status(500).json({ error: 'Failed to submit complaint.' });
  }
}

async function trackComplaint(req, res) {
  try {
    const { complaintNo } = req.params;
    const complaint = await Complaint.findOne({ complaintNo: complaintNo.trim().toUpperCase() }).lean();
    if (!complaint) return res.status(404).json({ error: 'Complaint not found', message: `No complaint found with number ${complaintNo}` });

    if (complaint.statusLogs) {
      complaint.statusLogs.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
    }
    delete complaint.adminNote;
    delete complaint.reporterEmail;
    delete complaint.reporterPhone;
    res.json({ success: true, complaint });
  } catch (err) {
    console.error('[trackComplaint]', err);
    res.status(500).json({ error: 'Failed to fetch complaint.' });
  }
}

module.exports = { getCategories, submitComplaint, trackComplaint };
