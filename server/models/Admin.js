const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  name         : { type: String, required: true, trim: true },
  email        : { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash : { type: String, required: true },
  role         : { type: String, default: 'officer', enum: ['officer','supervisor','superadmin'] },
  department   : { type: String, default: null },
  isActive     : { type: Boolean, default: true },
}, { timestamps: true });

AdminSchema.methods.comparePassword = async function(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

AdminSchema.statics.hashPassword = async function(plain) {
  return bcrypt.hash(plain, 12);
};

AdminSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Admin', AdminSchema);
