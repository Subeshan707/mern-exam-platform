require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Group = require('./models/Group');
const Exam = require('./models/Exam');
const ExamAttempt = require('./models/ExamAttempt');
const Result = require('./models/Result');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });
    const totalGroups = await Group.countDocuments();
    const totalExams = await Exam.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysExams = await Exam.find({
      date: { $gte: today, $lt: tomorrow }
    }).countDocuments();

    const ongoingExams = await ExamAttempt.countDocuments({ status: 'in-progress' });
    const recentResults = await Result.find().populate('student', 'name rollNumber').populate('exam', 'name').sort({ createdAt: -1 }).limit(10);
    
    console.log('Got to passCount');
    const passCount = await Result.countDocuments({ isPass: true });
    console.log('passCount', passCount);

    console.log('Got to failCount');
    const failCount = await Result.countDocuments({ isPass: false });
    console.log('failCount', failCount);

    console.log('Got to recentExams');
    const recentExams = await Exam.find().sort({ createdAt: -1 }).limit(5);

    const examStats = await Exam.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    
    console.log('All queries succeeded.');
  } catch (err) {
    console.error('Error running queries:', err);
  } finally {
    mongoose.disconnect();
  }
}
test();
