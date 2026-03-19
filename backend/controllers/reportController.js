const Student = require('../models/Student');
const Group = require('../models/Group');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const ExamAttempt = require('../models/ExamAttempt');
const ExamAssignment = require('../models/ExamAssignment');
const XLSX = require('xlsx');
let PDFDocument;
try { PDFDocument = require('pdfkit'); } catch(e) { /* pdfkit optional */ }

// Generate students report
exports.generateStudentsReport = async (req, res) => {
  try {
    const { format = 'csv', fields, group, search } = req.query;

    let query = {};
    if (group) query.group = group;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('group', 'name year batch section')
      .sort({ createdAt: -1 });

    // Select fields
    const selectedFields = fields ? fields.split(',') : [
      'name', 'rollNumber', 'email', 'group', 'isActive', 'lastLogin', 'createdAt'
    ];

    const reportData = students.map(student => {
      const data = {};
      selectedFields.forEach(field => {
        if (field === 'group') {
          data[field] = student.group ? 
            `${student.group.name} (${student.group.year} - ${student.group.batch} - ${student.group.section})` : 
            'N/A';
        } else {
          data[field] = student[field];
        }
      });
      return data;
    });

    if (format === 'csv') {
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=students-report.csv');
      return res.send(csv);
    } else if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=students-report.xlsx');
      return res.send(buffer);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Generate students report error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Generate exams report
exports.generateExamsReport = async (req, res) => {
  try {
    const { format = 'csv', fromDate, toDate, status } = req.query;

    let query = {};
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }
    if (status) query.status = status;

    const exams = await Exam.find(query)
      .populate('createdBy', 'username')
      .sort({ date: -1 });

    const reportData = await Promise.all(exams.map(async exam => {
      const assignments = await ExamAssignment.countDocuments({ exam: exam._id });
      const attempts = await ExamAttempt.countDocuments({ exam: exam._id });
      const completed = await ExamAttempt.countDocuments({ exam: exam._id, status: 'completed' });
      
      return {
        'Exam Name': exam.name,
        'Date': exam.date.toISOString().split('T')[0],
        'Start Time': exam.startTime,
        'Duration (mins)': exam.duration,
        'Total Marks': exam.totalMarks,
        'Pass Mark': exam.passMark,
        'Category': exam.category,
        'Status': exam.status,
        'Questions': exam.questions.length,
        'Assigned To': assignments,
        'Total Attempts': attempts,
        'Completed': completed,
        'Created By': exam.createdBy?.username,
        'Created At': exam.createdAt
      };
    }));

    if (format === 'csv') {
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=exams-report.csv');
      return res.send(csv);
    } else if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Exams');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=exams-report.xlsx');
      return res.send(buffer);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Generate exams report error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Generate results report
exports.generateResultsReport = async (req, res) => {
  try {
    const { format = 'csv', examId, fromDate, toDate } = req.query;

    let query = {};
    if (examId) query.exam = examId;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const results = await Result.find(query)
      .populate('exam', 'name totalMarks passMark')
      .populate('student', 'name rollNumber email group')
      .populate('publishedBy', 'username')
      .sort({ createdAt: -1 });

    const reportData = results.map(result => ({
      'Exam Name': result.exam?.name,
      'Student Name': result.student?.name,
      'Roll Number': result.student?.rollNumber,
      'Email': result.student?.email,
      'Marks Obtained': result.marksObtained,
      'Total Marks': result.totalMarks,
      'Percentage': result.percentage.toFixed(2) + '%',
      'Result': result.isPass ? 'PASS' : 'FAIL',
      'Grade': result.grade,
      'Published': result.isPublished ? 'Yes' : 'No',
      'Published By': result.publishedBy?.username,
      'Published At': result.publishedAt,
      'Completed At': result.createdAt
    }));

    if (format === 'csv') {
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=results-report.csv');
      return res.send(csv);
    } else if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Results');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=results-report.xlsx');
      return res.send(buffer);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Generate results report error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Generate group report
exports.generateGroupReport = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { format = 'csv' } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
      });
    }

    const students = await Student.find({ group: groupId })
      .select('name rollNumber email isActive createdAt');

    const exams = await ExamAssignment.find({ group: groupId })
      .populate('exam', 'name date totalMarks')
      .populate('assignedBy', 'username');

    const results = await Result.find({ 
      student: { $in: students.map(s => s._id) } 
    })
    .populate('exam', 'name')
    .populate('student', 'name rollNumber');

    // Group statistics
    const stats = {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.isActive).length,
      totalExamsAssigned: exams.length,
      examsTaken: results.length,
      passRate: results.length > 0 
        ? (results.filter(r => r.isPass).length / results.length) * 100 
        : 0,
      averagePercentage: results.length > 0 
        ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
        : 0
    };

    const reportData = {
      groupInfo: group,
      statistics: stats,
      students: students,
      exams: exams,
      results: results
    };

    if (format === 'csv' || format === 'excel') {
      // Create multiple sheets for comprehensive report
      const wb = XLSX.utils.book_new();
      
      // Group Info sheet
      const groupSheet = XLSX.utils.json_to_sheet([group.toJSON()]);
      XLSX.utils.book_append_sheet(wb, groupSheet, 'Group Info');
      
      // Students sheet
      const studentsSheet = XLSX.utils.json_to_sheet(students.length > 0 ? students.map(s => s.toJSON()) : [{}]);
      XLSX.utils.book_append_sheet(wb, studentsSheet, 'Students');
      
      // Exams sheet
      const examsSheet = XLSX.utils.json_to_sheet(exams.length > 0 ? exams.map(e => ({
        'Exam Name': e.exam?.name,
        'Date': e.exam?.date,
        'Total Marks': e.exam?.totalMarks,
        'Assigned At': e.assignedAt,
        'Status': e.status
      })) : [{}]);
      XLSX.utils.book_append_sheet(wb, examsSheet, 'Exams');
      
      // Results sheet
      const resultsSheet = XLSX.utils.json_to_sheet(results.length > 0 ? results.map(r => ({
        'Student Name': r.student?.name,
        'Roll Number': r.student?.rollNumber,
        'Exam Name': r.exam?.name,
        'Marks': r.marksObtained,
        'Percentage': r.percentage,
        'Result': r.isPass ? 'PASS' : 'FAIL'
      })) : [{}]);
      XLSX.utils.book_append_sheet(wb, resultsSheet, 'Results');

      if (format === 'csv') {
        const csvBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=group-${group.name}-report.csv`);
        return res.send(csvBuffer);
      }

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=group-${group.name}-report.xlsx`);
      return res.send(buffer);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Generate group report error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Generate performance report
exports.generatePerformanceReport = async (req, res) => {
  try {
    const { format = 'csv', studentId, fromDate, toDate } = req.query;

    let query = {};
    if (studentId) query.student = studentId;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const results = await Result.find(query)
      .populate('exam', 'name category date totalMarks')
      .populate('student', 'name rollNumber group')
      .sort({ createdAt: -1 });

    // Group by student
    const studentPerformance = {};
    results.forEach(result => {
      if (!result.student || !result.student._id) return;
      const sid = result.student._id.toString();
      if (!studentPerformance[sid]) {
        studentPerformance[sid] = {
          student: result.student,
          exams: [],
          totalExams: 0,
          totalMarks: 0,
          averagePercentage: 0,
          passedExams: 0
        };
      }
      
      studentPerformance[sid].exams.push({
        exam: result.exam?.name || 'Unknown',
        date: result.exam?.date,
        marks: result.marksObtained,
        percentage: result.percentage,
        result: result.isPass ? 'PASS' : 'FAIL'
      });
      
      studentPerformance[sid].totalExams++;
      studentPerformance[sid].totalMarks += result.marksObtained;
      if (result.isPass) studentPerformance[sid].passedExams++;
    });

    // Calculate averages
    Object.values(studentPerformance).forEach(perf => {
      perf.averagePercentage = perf.totalMarks / (perf.totalExams * 100) * 100;
    });

    if (format === 'csv') {
      const reportData = Object.values(studentPerformance).flatMap(perf => 
        perf.exams.map(exam => ({
          'Student Name': perf.student.name,
          'Roll Number': perf.student.rollNumber,
          'Exam Name': exam.exam,
          'Exam Date': exam.date,
          'Marks Obtained': exam.marks,
          'Percentage': exam.percentage.toFixed(2) + '%',
          'Result': exam.result
        }))
      );

      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=performance-report.csv');
      return res.send(csv);
    }

    res.json({
      success: true,
      data: Object.values(studentPerformance)
    });

  } catch (error) {
    console.error('Generate performance report error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Export analytics dashboard data
exports.getAnalyticsData = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get overall statistics
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });
    const totalGroups = await Group.countDocuments();
    const totalExams = await Exam.countDocuments();
    const publishedExams = await Exam.countDocuments({ status: 'published' });
    const totalResults = await Result.countDocuments();
    const publishedResults = await Result.countDocuments({ isPublished: true });

    // Get exam attempts over time
    const attemptsOverTime = await ExamAttempt.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get pass/fail ratio
    const passFailRatio = await Result.aggregate([
      {
        $group: {
          _id: '$isPass',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top performing exams
    const topExams = await Result.aggregate([
      {
        $group: {
          _id: '$exam',
          averageScore: { $avg: '$percentage' },
          totalStudents: { $sum: 1 },
          passed: { $sum: { $cond: ['$isPass', 1, 0] } }
        }
      },
      { $sort: { averageScore: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: '_id',
          as: 'examDetails'
        }
      }
    ]);

    // Get violation statistics
    const violations = await ExamAttempt.aggregate([
      {
        $group: {
          _id: null,
          totalViolations: { $sum: '$violations.count' },
          averageViolations: { $avg: '$violations.count' },
          maxViolations: { $max: '$violations.count' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          activeStudents,
          totalGroups,
          totalExams,
          publishedExams,
          totalResults,
          publishedResults
        },
        trends: {
          attemptsOverTime,
          passFail: {
            pass: passFailRatio.find(r => r._id === true)?.count || 0,
            fail: passFailRatio.find(r => r._id === false)?.count || 0
          }
        },
        topExams,
        violations: violations[0] || {
          totalViolations: 0,
          averageViolations: 0,
          maxViolations: 0
        }
      }
    });

  } catch (error) {
    console.error('Get analytics data error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]?.toString() || '';
      return `"${value.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}