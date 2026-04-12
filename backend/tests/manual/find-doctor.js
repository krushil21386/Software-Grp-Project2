const path = require('path');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function findDoctor() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicare');
  const doctor = await User.findOne({ role: 'doctor' });
  if (doctor) {
    console.log('Found doctor:', doctor.email);
  } else {
    console.log('No doctor found in DB');
  }
  process.exit();
}
findDoctor();
