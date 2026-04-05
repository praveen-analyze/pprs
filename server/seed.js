require('dotenv').config();
const mongoose  = require('mongoose');
const Admin     = require('./models/Admin');
const Complaint = require('./models/Complaint');

const sampleComplaints = [
  {
    complaintNo: 'MUN-2026-00001', category: 'Road',
    description: 'Large pothole on the main road near the central bus stand causing damage to vehicles and posing safety risk.',
    status: 'in_progress', latitude: 13.0827, longitude: 80.2707,
    address: 'Anna Salai, Chennai, Tamil Nadu 600002',
    reporterName: 'Ravi Kumar', reporterEmail: 'ravi@example.com', reporterPhone: '9876543210',
    department: 'Roads & Infrastructure', publicNote: 'Our team has been dispatched. Repair within 48 hours.',
    images: [],
    statusLogs: [
      { oldStatus: '', newStatus: 'submitted', changedBy: 'system', note: 'Complaint submitted', changedAt: new Date(Date.now() - 5*86400000) },
      { oldStatus: 'submitted', newStatus: 'under_review', changedBy: 'Super Admin', note: 'Under review', changedAt: new Date(Date.now() - 4*86400000) },
      { oldStatus: 'under_review', newStatus: 'assigned', changedBy: 'Super Admin', note: 'Assigned to Roads dept', changedAt: new Date(Date.now() - 3*86400000) },
      { oldStatus: 'assigned', newStatus: 'in_progress', changedBy: 'Super Admin', note: 'Field team dispatched', changedAt: new Date(Date.now() - 86400000) },
    ],
  },
  {
    complaintNo: 'MUN-2026-00002', category: 'Garbage',
    description: 'Garbage has not been collected for over two weeks. Pile is attracting mosquitoes and stray animals causing health hazard.',
    status: 'submitted', latitude: 13.0604, longitude: 80.2496,
    address: 'T Nagar, Chennai, Tamil Nadu 600017',
    reporterName: 'Priya Sharma', reporterEmail: 'priya@example.com', reporterPhone: '9123456780',
    department: null, publicNote: null, images: [],
    statusLogs: [{ oldStatus: '', newStatus: 'submitted', changedBy: 'system', note: 'Complaint submitted', changedAt: new Date(Date.now() - 2*86400000) }],
  },
  {
    complaintNo: 'MUN-2026-00003', category: 'Streetlight',
    description: 'Three streetlights near the school have been non-functional for 10 days making the area unsafe at night.',
    status: 'resolved', latitude: 13.0732, longitude: 80.2609,
    address: 'Adyar, Chennai, Tamil Nadu 600020',
    reporterName: 'Sundar Raj', reporterEmail: 'sundar@example.com',
    department: 'Electrical', publicNote: 'All streetlights repaired and functional.',
    images: [],
    statusLogs: [
      { oldStatus: '', newStatus: 'submitted', changedBy: 'system', note: 'Complaint submitted', changedAt: new Date(Date.now() - 10*86400000) },
      { oldStatus: 'submitted', newStatus: 'assigned', changedBy: 'Super Admin', note: 'Assigned to Electrical', changedAt: new Date(Date.now() - 8*86400000) },
      { oldStatus: 'assigned', newStatus: 'resolved', changedBy: 'Super Admin', note: 'All lights repaired', changedAt: new Date(Date.now() - 2*86400000) },
    ],
  },
  {
    complaintNo: 'MUN-2026-00004', category: 'Drainage',
    description: 'Blocked drainage causing water logging on the entire street after every rain. Residents cannot walk through.',
    status: 'under_review', latitude: 13.0878, longitude: 80.2785,
    address: 'Perambur, Chennai, Tamil Nadu 600011',
    reporterName: null, reporterEmail: null, department: null, publicNote: null, images: [],
    statusLogs: [
      { oldStatus: '', newStatus: 'submitted', changedBy: 'system', note: 'Complaint submitted', changedAt: new Date(Date.now() - 3*86400000) },
      { oldStatus: 'submitted', newStatus: 'under_review', changedBy: 'Super Admin', note: 'Site inspection scheduled', changedAt: new Date(Date.now() - 86400000) },
    ],
  },
  {
    complaintNo: 'MUN-2026-00005', category: 'Water',
    description: 'Water supply completely cut off for 3 days. Over 50 families severely affected with no drinking water.',
    status: 'assigned', latitude: 13.0500, longitude: 80.2500,
    address: 'Velachery, Chennai, Tamil Nadu 600042',
    reporterName: 'Meena Krishnan', reporterEmail: 'meena@example.com', reporterPhone: '9988776655',
    department: 'Water Supply', publicNote: 'Water tanker arranged. Permanent fix in progress.',
    images: [],
    statusLogs: [
      { oldStatus: '', newStatus: 'submitted', changedBy: 'system', note: 'Complaint submitted', changedAt: new Date(Date.now() - 4*86400000) },
      { oldStatus: 'submitted', newStatus: 'assigned', changedBy: 'Super Admin', note: 'Assigned to Water Supply', changedAt: new Date(Date.now() - 2*86400000) },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const existing = await Admin.findOne({ role: 'superadmin' });
    if (existing) {
      console.log('⚠️  Superadmin already exists:', existing.email);
    } else {
      const passwordHash = await Admin.hashPassword('Admin@123');
      const admin = await Admin.create({ name: 'Super Admin', email: 'admin@municipal.gov', passwordHash, role: 'superadmin', department: 'General' });
      console.log('✅ Superadmin created');
      console.log('   Email    :', admin.email);
      console.log('   Password : Admin@123');
      console.log('   ⚠️  Change this password after first login!\n');
    }

    const count = await Complaint.countDocuments();
    if (count > 0) {
      console.log(`⚠️  ${count} complaints already exist. Skipping sample data.`);
    } else {
      await Complaint.insertMany(sampleComplaints);
      console.log(`✅ ${sampleComplaints.length} sample complaints created\n`);
    }

    console.log('🚀 Seed complete! Run: npm run dev');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
