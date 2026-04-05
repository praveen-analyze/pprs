const Complaint = require('../models/Complaint');

async function generateComplaintNo() {
  const count  = await Complaint.countDocuments();
  const year   = new Date().getFullYear();
  const padded = String(count + 1).padStart(5, '0');
  return `MUN-${year}-${padded}`;
}

module.exports = generateComplaintNo;
