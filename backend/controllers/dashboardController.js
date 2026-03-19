const Student = require('../models/Student');
const Group = require('../models/Group');
const Exam = require('../models/Exam');
const ExamAssignment = require('../models/ExamAssignment');
const ExamAttempt = require('../models/ExamAttempt');
const Result = require('../models/Result');

// Get admin dashboard data
exports.getAdminDashboard = async (req, res) => {
  try {
    // Get counts
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });
    const totalGroups = await Group.countDocuments();
    const totalExams = await Exam.countDocuments();
    
    // Get today's exams
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysExams = await Exam.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).countDocuments();

    // Get ongoing exams
    const ongoingExams = await ExamAttempt.countDocuments({
      status: 'in-progress'
    });

    // Get recent results
    const recentResults = await Result.find()
      .populate('student', 'name rollNumber')
      .populate('exam', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get Pass/Fail stats
    const passCount = await Result.countDocuments({ isPass: true });
    const failCount = await Result.countDocuments({ isPass: false });

    // Get recent exams
    const recentExams = await Exam.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get exam performance statistics (Option B real data)
    const examStats = await Result.aggregate([
      {
        $group: {
          _id: '$exam',
          students: { $sum: 1 },
          avgScore: { $avg: '$percentage' }
        }
      },
      {
        $lookup: {
          from: 'exams',         // Target the 'exams' collection
          localField: '_id',
          foreignField: '_id',
          as: 'examData'
        }
      },
      { $unwind: '$examData' },
      {
        $project: {
          _id: 0,
          name: '$examData.name',
          date: '$examData.createdAt',
          students: 1,
          avgScore: { $round: ['$avgScore', 1] }
        }
      },
      { $sort: { date: 1 } },
      { $limit: 8 }
    ]);

    // Get recent activities
    const recentActivities = [];

    // Recent exam attempts
    const recentAttempts = await ExamAttempt.find()
      .populate('student', 'name')
      .populate('exam', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    recentAttempts.forEach(attempt => {
      recentActivities.push({
        type: 'exam_attempt',
        description: `${attempt.student?.name} started ${attempt.exam?.name}`,
        timestamp: attempt.createdAt,
        status: attempt.status
      });
    });

    // Recent student registrations
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5);

    recentStudents.forEach(student => {
      recentActivities.push({
        type: 'student_registration',
        description: `${student.name} registered`,
        timestamp: student.createdAt
      });
    });

    // Sort activities by timestamp
    recentActivities.sort((a, b) => b.timestamp - a.timestamp);
    recentActivities.slice(0, 10);

    res.json({
      success: true,
      data: {
        counts: {
          totalStudents,
          activeStudents,
          totalGroups,
          totalExams,
          todaysExams,
          ongoingExams
        },
        examStats: examStats,
        passFailRatio: { pass: passCount, fail: failCount },
        recentExams,
        recentResults,
        recentActivities
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get student dashboard data
exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const studentGroupId = req.user?.group?._id || req.user?.group;
    const now = new Date();

    // Get student's assigned exams
    const assignments = await ExamAssignment.find({
      $or: [
        { student: studentId },
        { group: studentGroupId }
      ]
    }).distinct('exam');

    // Get all exams assigned to student
    const exams = await Exam.find({
      _id: { $in: assignments },
      status: { $in: ['published', 'in-progress', 'completed'] }
    });

    // Categorize exams
    const upcomingExams = [];
    const currentExams = [];
    const completedExams = [];

    const tzOffset = parseInt(req.headers['x-timezone-offset'] || '0');

    for (const exam of exams) {
      const examStartTime = new Date(exam.date);
      const [hours, minutes] = (exam.startTime || '00:00').split(':').map(Number);
      
      examStartTime.setUTCHours(hours);
      examStartTime.setUTCMinutes(minutes + tzOffset);
      examStartTime.setUTCSeconds(0);
      
      const examEndTime = new Date(examStartTime.getTime() + exam.duration * 60000);

      // Check if student has already attempted
      const attempt = await ExamAttempt.findOne({
        exam: exam._id,
        student: studentId
      });

      if (attempt && attempt.status === 'completed') {
        // Check if result is published
        const result = await Result.findOne({
          exam: exam._id,
          student: studentId
        });

        completedExams.push({
          ...exam.toJSON(),
          attempt: {
            status: attempt.status,
            score: result?.isPublished ? result.marksObtained : null,
            percentage: result?.isPublished ? result.percentage : null,
            result: result?.isPublished ? result.isPass ? 'PASS' : 'FAIL' : 'Pending',
            isPublished: result?.isPublished || false,
            submittedAt: attempt.endTime
          }
        });
      } else if (now < examStartTime) {
        upcomingExams.push({
          ...exam.toJSON(),
          startTimeFormatted: examStartTime
        });
      } else if (now >= examStartTime && now <= examEndTime) {
        currentExams.push({
          ...exam.toJSON(),
          attempt: attempt ? {
            id: attempt._id,
            startTime: attempt.startTime,
            timeRemaining: examEndTime - now,
            answeredCount: attempt.answers.filter(a => a.isAnswered).length,
            totalQuestions: attempt.answers.length
          } : null,
          timeRemaining: examEndTime - now
        });
      } else if (now > examEndTime && (!attempt || attempt.status !== 'completed')) {
        // Exam expired without attempt
        completedExams.push({
          ...exam.toJSON(),
          attempt: {
            status: 'expired',
            message: 'Exam expired without attempt'
          }
        });
      }
    }

    // Get student statistics
    const totalAttempts = await ExamAttempt.countDocuments({ student: studentId });
    const completedAttempts = await ExamAttempt.countDocuments({ 
      student: studentId,
      status: 'completed' 
    });
    
    const results = await Result.find({ 
      student: studentId,
      isPublished: true 
    });

    const averageScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
      : 0;

    // Get recent results
    const recentResults = await Result.find({ 
      student: studentId,
      isPublished: true 
    })
    .populate('exam', 'name date')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        exams: {
          upcoming: upcomingExams,
          current: currentExams,
          completed: completedExams
        },
        statistics: {
          totalExams: exams.length,
          totalAttempts,
          completedAttempts,
          passedExams: results.filter(r => r.isPass).length,
          averageScore: averageScore.toFixed(2)
        },
        recentResults
      }
    });

  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get exam statistics for student
exports.getStudentExamStats = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get all results
    const results = await Result.find({ 
      student: studentId,
      isPublished: true 
    }).populate('exam', 'name category');

    // Group by category
    const categoryWise = {};
    results.forEach(result => {
      const category = result.exam.category || 'Other';
      if (!categoryWise[category]) {
        categoryWise[category] = {
          total: 0,
          passed: 0,
          averageScore: 0,
          totalScore: 0
        };
      }
      categoryWise[category].total++;
      categoryWise[category].totalScore += result.percentage;
      if (result.isPass) categoryWise[category].passed++;
    });

    // Calculate averages
    Object.keys(categoryWise).forEach(category => {
      categoryWise[category].averageScore = 
        categoryWise[category].totalScore / categoryWise[category].total;
    });

    // Get monthly performance
    const monthlyPerformance = await Result.aggregate([
      {
        $match: {
          student: studentId,
          isPublished: true,
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          averageScore: { $avg: '$percentage' },
          examsTaken: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overall: {
          totalExams: results.length,
          passedExams: results.filter(r => r.isPass).length,
          averageScore: results.length > 0
            ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
            : 0,
          bestScore: results.length > 0
            ? Math.max(...results.map(r => r.percentage))
            : 0
        },
        categoryWise,
        monthlyPerformance
      }
    });

  } catch (error) {
    console.error('Get student exam stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};