const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const ExamAttempt = require('../models/ExamAttempt');

// Get all results (admin)
exports.getAllResults = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      exam, 
      student, 
      group,
      isPublished,
      fromDate,
      toDate,
      search 
    } = req.query;
    
    let query = {};

    if (exam) query.exam = exam;
    if (student) query.student = student;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    // Search by student name/roll number
    if (search) {
      const students = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      query.student = { $in: students };
    }

    // Filter by group
    if (group) {
      const students = await Student.find({ group }).distinct('_id');
      query.student = { $in: students };
    }

    const results = await Result.find(query)
      .populate('exam', 'name date totalMarks passMark')
      .populate('student', 'name rollNumber email group')
      .populate('publishedBy', 'username')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Result.countDocuments(query);

    // Get statistics
    const stats = await Result.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageMarks: { $avg: '$marksObtained' },
          highestMarks: { $max: '$marksObtained' },
          lowestMarks: { $min: '$marksObtained' },
          totalPassed: { $sum: { $cond: ['$isPass', 1, 0] } },
          totalFailed: { $sum: { $cond: ['$isPass', 0, 1] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      statistics: stats[0] || {
        averageMarks: 0,
        highestMarks: 0,
        lowestMarks: 0,
        totalPassed: 0,
        totalFailed: 0
      }
    });

  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get result by ID
exports.getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('exam')
      .populate('student', 'name rollNumber email group')
      .populate('attempt')
      .populate('publishedBy', 'username');

    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'Result not found' 
      });
    }

    // Get attempt details
    const attempt = await ExamAttempt.findById(result.attempt)
      .populate({
        path: 'exam',
        select: 'questions'
      });

    // Prepare detailed analysis
    const analysis = {
      totalQuestions: attempt.exam.questions.length,
      answered: attempt.answers.filter(a => a.isAnswered).length,
      notAnswered: attempt.answers.filter(a => !a.isAnswered && a.isVisited).length,
      notVisited: attempt.answers.filter(a => !a.isVisited).length,
      correct: attempt.answers.filter(a => a.isCorrect).length,
      incorrect: attempt.answers.filter(a => a.isAnswered && !a.isCorrect).length,
      timeSpent: attempt.timeTaken,
      violations: attempt.violations.count,
      questionWise: attempt.answers.map(answer => {
        const question = attempt.exam.questions.find(q => 
          q._id.toString() === answer.questionId.toString()
        );
        return {
          question: question.question,
          selectedOption: answer.selectedOption,
          correctAnswer: question.correctAnswer,
          isCorrect: answer.isCorrect,
          marksObtained: answer.marksObtained,
          maxMarks: question.marks,
          timeSpent: answer.timeSpent
        };
      })
    };

    res.json({
      success: true,
      data: {
        ...result.toJSON(),
        analysis
      }
    });

  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get student's results
exports.getMyResults = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const results = await Result.find({ 
      student: req.user._id,
      isPublished: true 
    })
    .populate('exam', 'name date duration totalMarks passMark category')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Result.countDocuments({ 
      student: req.user._id,
      isPublished: true 
    });

    // Calculate statistics
    const stats = {
      totalExams: total,
      passedExams: results.filter(r => r.isPass).length,
      averagePercentage: results.length > 0 
        ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
        : 0,
      bestScore: results.length > 0 
        ? Math.max(...results.map(r => r.percentage)) 
        : 0
    };

    res.json({
      success: true,
      data: results,
      statistics: stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get my results error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Publish results
exports.publishResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const { publishAll = true, studentIds = [] } = req.body;

    let query = { exam: examId, isPublished: false };
    
    if (!publishAll && studentIds.length > 0) {
      query.student = { $in: studentIds };
    }

    const results = await Result.updateMany(
      query,
      {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: req.user._id
      }
    );

    res.json({
      success: true,
      message: `Published ${results.modifiedCount} results`,
      data: {
        publishedCount: results.modifiedCount
      }
    });

  } catch (error) {
    console.error('Publish results error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Unpublish results
exports.unpublishResults = async (req, res) => {
  try {
    const { examId } = req.params;

    const results = await Result.updateMany(
      { exam: examId, isPublished: true },
      {
        isPublished: false,
        publishedAt: null,
        publishedBy: null
      }
    );

    res.json({
      success: true,
      message: `Unpublished ${results.modifiedCount} results`,
      data: {
        unpublishedCount: results.modifiedCount
      }
    });

  } catch (error) {
    console.error('Unpublish results error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Update result manually
exports.updateResult = async (req, res) => {
  try {
    const { marksObtained, remarks } = req.body;

    const result = await Result.findById(req.params.id).populate('exam', 'passMark');
    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'Result not found' 
      });
    }

    // Update marks
    if (marksObtained !== undefined) {
      result.marksObtained = marksObtained;
      result.percentage = (marksObtained / result.totalMarks) * 100;
      result.isPass = result.percentage >= (result.exam?.passMark || 40);
    }

    if (remarks) result.remarks = remarks;

    await result.save();

    // Update attempt marks if attempt exists
    if (result.attempt) {
      await ExamAttempt.findByIdAndUpdate(result.attempt, {
        totalMarks: marksObtained,
        percentage: result.percentage,
        result: result.isPass ? 'pass' : 'fail'
      });
    }

    res.json({
      success: true,
      message: 'Result updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get result analytics
exports.getResultAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;

    const results = await Result.find({ exam: examId })
      .populate('student', 'group');

    if (results.length === 0) {
      return res.json({
        success: true,
        data: {
          overall: {
            totalStudents: 0,
            passed: 0,
            failed: 0,
            passPercentage: 0,
            averageMarks: 0,
            highestMarks: 0,
            lowestMarks: 0,
            totalMarks: 0
          },
          groupWise: {},
          distribution: {
            '90-100': 0, '80-89': 0, '70-79': 0,
            '60-69': 0, '50-59': 0, '40-49': 0, 'below-40': 0
          },
          topPerformers: [],
          message: 'No results found for this exam'
        }
      });
    }

    // Overall statistics
    const overall = {
      totalStudents: results.length,
      passed: results.filter(r => r.isPass).length,
      failed: results.filter(r => !r.isPass).length,
      passPercentage: (results.filter(r => r.isPass).length / results.length) * 100,
      averageMarks: results.reduce((sum, r) => sum + r.marksObtained, 0) / results.length,
      highestMarks: Math.max(...results.map(r => r.marksObtained)),
      lowestMarks: Math.min(...results.map(r => r.marksObtained)),
      totalMarks: results[0].totalMarks
    };

    // Group-wise analysis
    const groupWise = {};
    results.forEach(result => {
      const groupId = result.student.group?.toString() || 'unknown';
      if (!groupWise[groupId]) {
        groupWise[groupId] = {
          total: 0,
          passed: 0,
          totalMarks: 0
        };
      }
      groupWise[groupId].total++;
      groupWise[groupId].totalMarks += result.marksObtained;
      if (result.isPass) groupWise[groupId].passed++;
    });

    // Marks distribution
    const distribution = {
      '90-100': results.filter(r => r.percentage >= 90).length,
      '80-89': results.filter(r => r.percentage >= 80 && r.percentage < 90).length,
      '70-79': results.filter(r => r.percentage >= 70 && r.percentage < 80).length,
      '60-69': results.filter(r => r.percentage >= 60 && r.percentage < 70).length,
      '50-59': results.filter(r => r.percentage >= 50 && r.percentage < 60).length,
      '40-49': results.filter(r => r.percentage >= 40 && r.percentage < 50).length,
      'below-40': results.filter(r => r.percentage < 40).length
    };

    // Top performers
    const topPerformers = await Result.find({ exam: examId })
      .populate('student', 'name rollNumber')
      .sort({ marksObtained: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        overall,
        groupWise,
        distribution,
        topPerformers
      }
    });

  } catch (error) {
    console.error('Get result analytics error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};