require('dotenv').config({ path: 'c:/Users/USER/Downloads/public-problem-reporting-system/municipal-board/server/.env' });
const mongoose = require('mongoose');

async function test() {
  console.log('Connecting to:', process.env.MONGODB_URI);
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('SUCCESS');
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
}
test();
