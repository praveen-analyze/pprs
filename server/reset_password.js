require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const admin = await Admin.findOne({ email: 'epraveen952@gmail.com' });
    if (!admin) {
      console.log('Admin not found!');
      process.exit(1);
    }

    const passwordHash = await Admin.hashPassword('Admin@123');
    admin.passwordHash = passwordHash;
    await admin.save();
    
    console.log('✅ Password successfully reset to: Admin@123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();
