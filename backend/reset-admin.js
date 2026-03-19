require('dotenv').config();
const mongoose = require('mongoose');

async function resetAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Admin = require('./models/Admin');
  
  const admin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (!admin) {
    console.log('No admin found, creating one...');
    const newAdmin = new Admin({
      username: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@examplatform.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'superadmin'
    });
    await newAdmin.save();
    console.log('Admin created.');
  } else {
    console.log('Admin found:', admin.email);
    admin.password = process.env.ADMIN_PASSWORD || 'Sube@123';
    await admin.save();
    console.log('Password reset to:', process.env.ADMIN_PASSWORD);
  }

  const updatedAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  const isValid = await updatedAdmin.comparePassword(process.env.ADMIN_PASSWORD);
  console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');

  // Also clean up any test data from previous runs
  const Student = require('./models/Student');
  const Group = require('./models/Group');
  const delStu = await Student.deleteMany({ rollNumber: { $in: ['TEST-001', 'BULK-001', 'BULK-002'] } });
  console.log('Cleaned up test students:', delStu.deletedCount);
  const delGrp = await Group.deleteMany({ name: 'API Test Group' });
  console.log('Cleaned up test groups:', delGrp.deletedCount);

  await mongoose.disconnect();
  console.log('Done!');
}

resetAdmin().catch(e => { console.error(e); process.exit(1); });
