const mongoose = require('mongoose');

// 📌 Status Log Schema
const StatusLogSchema = new mongoose.Schema({
  oldStatus : { type: String, trim: true },
  newStatus : { type: String, trim: true },
  changedBy : { type: String, trim: true },
  note      : { type: String, default: null, trim: true },
  changedAt : { type: Date, default: Date.now },
}, { _id: false });

// 📌 Complaint Image Schema
const ComplaintImageSchema = new mongoose.Schema({
  imageUrl : { type: String, required: true, trim: true },
  publicId : { type: String, required: true, trim: true },
}, { _id: false });

// 📌 Main Complaint Schema
const ComplaintSchema = new mongoose.Schema({
  complaintNo   : { type: String, required: true, unique: true, trim: true },

  category      : { 
    type: String, 
    required: true, 
    enum: ['Road','Garbage','Streetlight','Drainage','Water','Other'],
    trim: true
  },

  description   : { type: String, required: true, minlength: 20, trim: true },

  status        : { 
    type: String, 
    default: 'submitted', 
    enum: ['submitted','under_review','assigned','in_progress','resolved','rejected']
  },

  latitude      : { type: Number, required: true },
  longitude     : { type: Number, required: true },

  address       : { type: String, required: true, trim: true },

  images        : [ComplaintImageSchema],
  statusLogs    : [StatusLogSchema],

  department    : { type: String, default: null, trim: true },
  adminNote     : { type: String, default: null, trim: true },
  publicNote    : { type: String, default: null, trim: true },

  reporterName  : { type: String, default: null, trim: true },
  reporterEmail : { type: String, default: null, trim: true },
  reporterPhone : { type: String, default: null, trim: true },

}, { timestamps: true });

// ✅ Useful Indexes (keep these)
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ createdAt: -1 });

// 🚀 Export Model
module.exports = mongoose.model('Complaint', ComplaintSchema);