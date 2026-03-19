const Exam = require('../models/Exam');
const ExamAssignment = require('../models/ExamAssignment');
const ExamAttempt = require('../models/ExamAttempt');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Group = require('../models/Group');
const XLSX = require('xlsx');
const { validationResult } = require('express-validator');

const findActiveAttemptForStudent = async (attemptOrExamId, studentId, populateExam = false) => {
  let query = {
    _id: attemptOrExamId,
    student: studentId,
    status: 'in-progress'
  };

  let finder = ExamAttempt.findOne(query);
  if (populateExam) finder = finder.populate('exam');
  let attempt = await finder;

  // Backward compatibility: if client accidentally sends exam id instead of attempt id.
  if (!attempt) {
    query = {
      exam: attemptOrExamId,
      student: studentId,
      status: 'in-progress'
    };

    finder = ExamAttempt.findOne(query).sort({ lastActive: -1, createdAt: -1 });
    if (populateExam) finder = finder.populate('exam');
    attempt = await finder;
  }

  return attempt;
};

// Get all exams
exports.getAllExams = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status,
      category,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (category) query.category = category;
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    // If student, only show assigned exams
    if (req.userRole === 'student') {
      const studentGroupId = req.user?.group?._id || req.user?.group;
      const assignments = await ExamAssignment.find({
        $or: [
          { student: req.user._id },
          { group: studentGroupId }
        ]
      }).distinct('exam');
      
      query._id = { $in: assignments };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const exams = await Exam.find(query)
      .populate('createdBy', 'username')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    const total = await Exam.countDocuments(query);

    // Get assignment counts for admin
    if (req.userRole === 'admin') {
      for (let exam of exams) {
        const assignmentCount = await ExamAssignment.countDocuments({ exam: exam._id });
        exam = exam.toJSON();
        exam.assignedCount = assignmentCount;
      }
    }

    res.json({
      success: true,
      data: exams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get exam by ID
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found' 
      });
    }

    // Check if student has access
    if (req.userRole === 'student') {
      const studentGroupId = req.user?.group?._id || req.user?.group;
      const hasAccess = await ExamAssignment.exists({
        exam: exam._id,
        $or: [
          { student: req.user._id },
          { group: studentGroupId }
        ]
      });

      if (!hasAccess) {
        return res.status(403).json({ 
          success: false,
          message: 'You do not have access to this exam' 
        });
      }

      // Don't send correct answers to students
      const examData = exam.toJSON();
      examData.questions = examData.questions.map(q => {
        delete q.correctAnswer;
        return q;
      });
      
      return res.json({
        success: true,
        data: examData
      });
    }

    // For admin, get additional stats
    const assignmentCount = await ExamAssignment.countDocuments({ exam: exam._id });
    const attemptCount = await ExamAttempt.countDocuments({ exam: exam._id });
    const completedCount = await ExamAttempt.countDocuments({ 
      exam: exam._id, 
      status: 'completed' 
    });

    res.json({
      success: true,
      data: {
        ...exam.toJSON(),
        stats: {
          assignedTo: assignmentCount,
          totalAttempts: attemptCount,
          completedAttempts: completedCount
        }
      }
    });

  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// In backend/controllers/examController.js - Replace your createExam function

exports.createExam = async (req, res) => {
    try {
        console.log('\n' + '🔥'.repeat(30));
        console.log('🔥 CREATE EXAM - START');
        console.log('🔥'.repeat(30));
        console.log('Time:', new Date().toISOString());
        console.log('User:', req.user?._id);
        console.log('User Role:', req.userRole);
        
        // Log the entire request body
        console.log('\n📦 Request Body:');
        console.log(JSON.stringify(req.body, null, 2));
        
        // Validate required fields
        const requiredFields = ['name', 'date', 'startTime', 'duration', 'passMark', 'questions'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            console.log('❌ Missing fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate date format
        try {
            const examDate = new Date(req.body.date);
            if (isNaN(examDate.getTime())) {
                throw new Error('Invalid date');
            }
            console.log('✅ Date valid:', examDate);
        } catch (dateError) {
            console.log('❌ Invalid date:', req.body.date);
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Validate questions
        if (!Array.isArray(req.body.questions)) {
            console.log('❌ Questions is not an array:', typeof req.body.questions);
            return res.status(400).json({
                success: false,
                message: 'Questions must be an array'
            });
        }

        if (req.body.questions.length === 0) {
            console.log('❌ Questions array is empty');
            return res.status(400).json({
                success: false,
                message: 'At least one question is required'
            });
        }

        // Validate each question
        for (let i = 0; i < req.body.questions.length; i++) {
            const q = req.body.questions[i];
            console.log(`\n🔍 Validating Question ${i + 1}:`);
            console.log(JSON.stringify(q, null, 2));
            
            if (!q.question) {
                console.log(`❌ Question ${i + 1} missing question text`);
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} is missing question text`
                });
            }
            
            if (!q.options) {
                console.log(`❌ Question ${i + 1} missing options object`);
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} must have options`
                });
            }
            
            if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) {
                console.log(`❌ Question ${i + 1} missing options:`, q.options);
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} must have all 4 options (A, B, C, D)`
                });
            }
            
            if (!q.correctAnswer || !['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
                console.log(`❌ Question ${i + 1} invalid correctAnswer:`, q.correctAnswer);
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} must have a valid correct answer (A, B, C, or D)`
                });
            }
            
            if (!q.marks || isNaN(q.marks) || q.marks <= 0) {
                console.log(`❌ Question ${i + 1} invalid marks:`, q.marks);
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} must have positive marks`
                });
            }
        }

        // Calculate total marks
        const totalMarks = req.body.questions.reduce((sum, q) => sum + q.marks, 0);
        console.log('\n📊 Total marks calculated:', totalMarks);

        // Prepare exam data
        const examData = {
            name: req.body.name,
            description: req.body.description || '',
            instructions: req.body.instructions || 'Read each question carefully.',
            date: new Date(req.body.date),
            startTime: req.body.startTime,
            duration: parseInt(req.body.duration),
            passMark: parseInt(req.body.passMark),
            totalMarks: totalMarks,
            questions: req.body.questions,
            settings: req.body.settings || {
                shuffleQuestions: false,
                shuffleOptions: false,
                enableFullScreen: true,
                enableTabSwitchDetection: true,
                autoSubmitViolations: true,
                maxViolations: 3
            },
            category: req.body.category || 'General',
            status: 'draft',
            createdBy: req.user._id
        };

        console.log('\n📦 Exam data to save:');
        console.log(JSON.stringify(examData, null, 2));

        // Try to create exam
        console.log('\n⏳ Creating exam in database...');
        const exam = new Exam(examData);
        await exam.save();
        
        console.log('\n✅ Exam created successfully!');
        console.log('Exam ID:', exam._id);
        console.log('🔥'.repeat(30) + '\n');

        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: exam
        });

    } catch (error) {
        console.log('\n' + '💥'.repeat(30));
        console.log('💥 EXAM CREATION ERROR');
        console.log('💥'.repeat(30));
        console.log('Error name:', error.name);
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
        
        if (error.errors) {
            console.log('\nValidation Errors:');
            Object.keys(error.errors).forEach(key => {
                console.log(`- ${key}:`, error.errors[key].message);
            });
        }
        
        if (error.code === 11000) {
            console.log('Duplicate key error:', error.keyValue);
            return res.status(400).json({ 
                success: false,
                message: 'Exam with this name already exists' 
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false,
                message: error.message,
                errors: error.errors 
            });
        }
        
        // Send detailed error in development
        res.status(500).json({ 
            success: false,
            message: error.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
};
// Update exam
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found' 
      });
    }

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: exam
    });

  } catch (error) {
    console.error('Update exam error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Exam with this name already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Delete exam
exports.deleteExam = async (req, res) => {
  try {
    const { force } = req.query;

    // Check if exam has attempts
    const attempts = await ExamAttempt.countDocuments({ exam: req.params.id });
    
    if (attempts > 0 && force !== 'true') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete exam with existing attempts. Use ?force=true to force delete.' 
      });
    }

    // Force delete: clean up all related data
    if (force === 'true') {
      await Result.deleteMany({ exam: req.params.id });
      await ExamAttempt.deleteMany({ exam: req.params.id });
    }

    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found' 
      });
    }

    // Delete related assignments
    await ExamAssignment.deleteMany({ exam: req.params.id });

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });

  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Upload questions via Excel
exports.uploadQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Validate and transform data
    const questions = [];
    const errors = [];

    data.forEach((row, index) => {
      try {
        // Validate required fields
        if (!row.Question || !row.OptionA || !row.OptionB || !row.OptionC || !row.OptionD || !row.CorrectAnswer || !row.Marks) {
          throw new Error('Missing required fields');
        }

        // Validate correct answer
        if (!['A', 'B', 'C', 'D'].includes(row.CorrectAnswer)) {
          throw new Error('CorrectAnswer must be A, B, C, or D');
        }

        // Validate marks
        const marks = parseFloat(row.Marks);
        if (isNaN(marks) || marks <= 0) {
          throw new Error('Marks must be a positive number');
        }

        questions.push({
          question: row.Question,
          options: {
            A: row.OptionA,
            B: row.OptionB,
            C: row.OptionC,
            D: row.OptionD
          },
          correctAnswer: row.CorrectAnswer,
          marks: marks,
          explanation: row.Explanation || '',
          difficulty: row.Difficulty || 'medium'
        });

      } catch (error) {
        errors.push({
          row: index + 2, // +2 because Excel rows start at 1 and header is row 1
          error: error.message,
          data: row
        });
      }
    });

    res.json({
      success: true,
      message: `Processed ${questions.length} questions, ${errors.length} errors`,
      data: {
        questions,
        errors,
        totalQuestions: questions.length,
        totalMarks: questions.reduce((sum, q) => sum + q.marks, 0)
      }
    });

  } catch (error) {
    console.error('Upload questions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing file' 
    });
  }
};

// Assign exam
exports.assignExam = async (req, res) => {
  try {
    const { examId, students, groups } = req.body;
    
    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found' 
      });
    }

    const assignments = [];
    const errors = [];

    // Assign to individual students
    if (students && students.length > 0) {
      for (const studentId of students) {
        try {
          // Check if student exists
          const student = await Student.findById(studentId);
          if (!student) {
            errors.push({ type: 'student', id: studentId, error: 'Student not found' });
            continue;
          }

          // Check if already assigned
          const existing = await ExamAssignment.findOne({
            exam: examId,
            student: studentId
          });

          if (existing) {
            errors.push({ type: 'student', id: studentId, error: 'Already assigned' });
            continue;
          }

          const assignment = new ExamAssignment({
            exam: examId,
            student: studentId,
            assignedBy: req.user._id
          });
          await assignment.save();
          assignments.push(assignment);

        } catch (error) {
          errors.push({ type: 'student', id: studentId, error: error.message });
        }
      }
    }

    // Assign to groups
    if (groups && groups.length > 0) {
      for (const groupId of groups) {
        try {
          // Check if group exists
          const group = await Group.findById(groupId);
          if (!group) {
            errors.push({ type: 'group', id: groupId, error: 'Group not found' });
            continue;
          }

          // Check if already assigned
          const existing = await ExamAssignment.findOne({
            exam: examId,
            group: groupId
          });

          if (existing) {
            errors.push({ type: 'group', id: groupId, error: 'Already assigned' });
            continue;
          }

          const assignment = new ExamAssignment({
            exam: examId,
            group: groupId,
            assignedBy: req.user._id
          });
          await assignment.save();
          assignments.push(assignment);

        } catch (error) {
          errors.push({ type: 'group', id: groupId, error: error.message });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${assignments.length} assignments, ${errors.length} failed`,
      data: {
        assignments,
        errors
      }
    });

  } catch (error) {
    console.error('Assign exam error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get exam assignments
exports.getExamAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const assignments = await ExamAssignment.find({ exam: req.params.id })
      .populate('student', 'name rollNumber email')
      .populate('group', 'name year batch section')
      .populate('assignedBy', 'username')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ assignedAt: -1 });

    const total = await ExamAssignment.countDocuments({ exam: req.params.id });

    res.json({
      success: true,
      data: assignments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Start exam (for students)
exports.startExam = async (req, res) => {
  try {
    if (req.userRole !== 'student') {
      return res.status(403).json({ 
        success: false,
        message: 'Only students can start exams' 
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found' 
      });
    }

    // Check if exam is assigned to student
    const studentGroupId = req.user?.group?._id || req.user?.group;
    const assignment = await ExamAssignment.findOne({
      exam: exam._id,
      $or: [
        { student: req.user._id },
        { group: studentGroupId }
      ]
    });

    if (!assignment) {
      return res.status(403).json({ 
        success: false,
        message: 'Exam not assigned to you' 
      });
    }

    // Check if exam is available
    const tzOffset = parseInt(req.headers['x-timezone-offset'] || '0');
    const now = new Date();
    const examStartTime = new Date(exam.date);
    const [hours, minutes] = (exam.startTime || '00:00').split(':').map(Number);
    
    examStartTime.setUTCHours(hours);
    examStartTime.setUTCMinutes(minutes + tzOffset);
    examStartTime.setUTCSeconds(0);

    const examEndTime = new Date(examStartTime.getTime() + (Number(exam.duration) || 0) * 60000);

    if (now < examStartTime) {
      return res.status(403).json({ 
        success: false,
        message: 'Exam has not started yet',
        data: { startTime: examStartTime }
      });
    }

    if (now > examEndTime) {
      return res.status(403).json({ 
        success: false,
        message: 'Exam has ended' 
      });
    }

    // Check for existing attempt
    let attempt = await ExamAttempt.findOne({
      exam: exam._id,
      student: req.user._id,
      status: 'in-progress'
    });

    if (!attempt) {
      // Create new attempt
      attempt = new ExamAttempt({
        exam: exam._id,
        student: req.user._id,
        assignment: assignment._id,
        startTime: now,
        answers: exam.questions.map(q => ({
          questionId: q._id
        })),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      await attempt.save();

      // Update assignment status
      assignment.status = 'started';
      await assignment.save();
    }

    // Prepare exam data for student (without correct answers)
    const examData = exam.toJSON();
    if (!exam.settings.showResultImmediately) {
      examData.questions = examData.questions.map(q => {
        delete q.correctAnswer;
        return q;
      });
    }

    res.json({
      success: true,
      message: 'Exam started successfully',
      data: {
        exam: examData,
        attempt: {
          id: attempt._id,
          startTime: attempt.startTime,
          answers: attempt.answers,
          violations: attempt.violations.count,
          timeRemaining: Math.max(0, examEndTime - now)
        }
      }
    });

  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Save answer
exports.saveAnswer = async (req, res) => {
  try {
    const { questionId, option } = req.body;

    const attempt = await findActiveAttemptForStudent(req.params.attemptId, req.user._id);

    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Active attempt not found' 
      });
    }

    const answer = attempt.answers.find(a => 
      a.questionId.toString() === questionId
    );
    
    if (answer) {
      answer.selectedOption = option;
      answer.isVisited = true;
      answer.isAnswered = !!option;
      answer.timeSpent = (answer.timeSpent || 0) + 10; // Assume 10 seconds spent
    }

    attempt.lastActive = new Date();
    attempt.autoSavedAt = new Date();
    await attempt.save();

    res.json({
      success: true,
      message: 'Answer saved',
      data: {
        questionId,
        option,
        autoSavedAt: attempt.autoSavedAt
      }
    });

  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Submit exam
exports.submitExam = async (req, res) => {
  try {
    const attempt = await findActiveAttemptForStudent(req.params.attemptId, req.user._id, true);

    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Active attempt not found' 
      });
    }

    // Calculate marks
    let totalMarks = 0;
    attempt.answers.forEach(answer => {
      const question = attempt.exam.questions.find(q => 
        q._id.toString() === answer.questionId.toString()
      );
      
      if (question) {
        if (answer.selectedOption === question.correctAnswer) {
          answer.marksObtained = question.marks;
          answer.isCorrect = true;
          totalMarks += question.marks;
        } else if (answer.selectedOption && attempt.exam.settings.negativeMarking > 0) {
          // Apply negative marking
          const negativeMarks = (question.marks * attempt.exam.settings.negativeMarking) / 100;
          answer.marksObtained = -negativeMarks;
          totalMarks -= negativeMarks;
        }
      }
    });

    const normalizedTotalMarks = Math.max(0, totalMarks);
    const normalizedPercentage = Math.min(
      100,
      Math.max(0, (normalizedTotalMarks / attempt.exam.totalMarks) * 100)
    );
    const isPass = totalMarks >= attempt.exam.passMark;

    // Create or update result record first so failed result validation
    // does not leave attempt in a completed-without-result state.
    let result = await Result.findOne({
      exam: attempt.exam._id,
      student: attempt.student
    });

    if (!result) {
      result = new Result({
        exam: attempt.exam._id,
        student: attempt.student,
        attempt: attempt._id,
        marksObtained: normalizedTotalMarks,
        totalMarks: attempt.exam.totalMarks,
        percentage: normalizedPercentage,
        isPass,
        isPublished: attempt.exam.settings.showResultImmediately
      });
    } else {
      result.attempt = attempt._id;
      result.marksObtained = normalizedTotalMarks;
      result.totalMarks = attempt.exam.totalMarks;
      result.percentage = normalizedPercentage;
      result.isPass = isPass;
      result.isPublished = attempt.exam.settings.showResultImmediately;
    }

    await result.save();

    attempt.status = 'completed';
    attempt.endTime = new Date();
    attempt.totalMarks = normalizedTotalMarks;
    attempt.percentage = normalizedPercentage;
    attempt.result = isPass ? 'pass' : 'fail';
    await attempt.save();

    // Update assignment
    await ExamAssignment.findOneAndUpdate(
      { exam: attempt.exam._id, student: attempt.student },
      { 
        status: 'completed',
        completedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        attemptId: attempt._id,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        result: attempt.result,
        showResult: attempt.exam.settings.showResultImmediately
      }
    });

  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Auto-submit exam due to violations
exports.autoSubmitExam = async (req, res) => {
  try {
    const attempt = await findActiveAttemptForStudent(req.params.attemptId, req.user._id, true);

    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Active attempt not found' 
      });
    }

    attempt.status = 'auto-submitted';
    attempt.endTime = new Date();
    
    // Calculate marks (same as submit)
    let totalMarks = 0;
    attempt.answers.forEach(answer => {
      const question = attempt.exam.questions.find(q => 
        q._id.toString() === answer.questionId.toString()
      );
      
      if (question && answer.selectedOption === question.correctAnswer) {
        answer.marksObtained = question.marks;
        answer.isCorrect = true;
        totalMarks += question.marks;
      }
    });

    const normalizedTotalMarks = Math.max(0, totalMarks);
    const normalizedPercentage = Math.min(
      100,
      Math.max(0, (normalizedTotalMarks / attempt.exam.totalMarks) * 100)
    );
    const isPass = totalMarks >= attempt.exam.passMark;

    let result = await Result.findOne({
      exam: attempt.exam._id,
      student: attempt.student
    });

    if (!result) {
      result = new Result({
        exam: attempt.exam._id,
        student: attempt.student,
        attempt: attempt._id,
        marksObtained: normalizedTotalMarks,
        totalMarks: attempt.exam.totalMarks,
        percentage: normalizedPercentage,
        isPass,
        isPublished: false
      });
    } else {
      result.attempt = attempt._id;
      result.marksObtained = normalizedTotalMarks;
      result.totalMarks = attempt.exam.totalMarks;
      result.percentage = normalizedPercentage;
      result.isPass = isPass;
      result.isPublished = false;
    }

    await result.save();

    attempt.totalMarks = normalizedTotalMarks;
    attempt.percentage = normalizedPercentage;
    attempt.result = isPass ? 'pass' : 'fail';
    await attempt.save();

    res.json({
      success: true,
      message: 'Exam auto-submitted due to violations'
    });

  } catch (error) {
    console.error('Auto-submit exam error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Record violation
exports.recordViolation = async (req, res) => {
  try {
    const { type, details } = req.body;

    const attempt = await findActiveAttemptForStudent(req.params.attemptId, req.user._id, true);

    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Active attempt not found' 
      });
    }

    // Check if auto-submit threshold reached
    const maxViolations = attempt.exam.settings.maxViolations || 3;
    
    attempt.violations.count += 1;
    attempt.violations.details.push({
      type,
      timestamp: new Date(),
      details,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await attempt.save();

    // Check if should auto-submit
    let shouldAutoSubmit = false;
    if (attempt.exam.settings.autoSubmitViolations && 
        attempt.violations.count >= maxViolations) {
      shouldAutoSubmit = true;
    }

    res.json({
      success: true,
      message: 'Violation recorded',
      data: {
        violationCount: attempt.violations.count,
        maxViolations,
        remainingAttempts: Math.max(0, maxViolations - attempt.violations.count),
        shouldAutoSubmit
      }
    });

  } catch (error) {
    console.error('Record violation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get exam results
exports.getExamResults = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let query = { exam: req.params.id };

    if (search) {
      const students = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      query.student = { $in: students };
    }

    const results = await Result.find(query)
      .populate('student', 'name rollNumber email group')
      .populate('attempt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ marksObtained: -1 });

    const total = await Result.countDocuments(query);

    // Calculate rank
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    res.json({
      success: true,
      data: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      statistics: {
        totalStudents: total,
        passed: results.filter(r => r.isPass).length,
        failed: results.filter(r => !r.isPass).length,
        averageMarks: results.reduce((sum, r) => sum + r.marksObtained, 0) / total,
        highestMarks: Math.max(...results.map(r => r.marksObtained)),
        lowestMarks: Math.min(...results.map(r => r.marksObtained))
      }
    });

  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get student's ongoing exams
exports.getStudentOngoingExams = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({
      student: req.user._id,
      status: 'in-progress'
    }).populate('exam');

    const ongoingExams = [];

    const tzOffset = parseInt(req.headers['x-timezone-offset'] || '0');

    for (const attempt of attempts) {
      const exam = attempt.exam;
      const examStartTime = new Date(exam.date);
      const [hours, minutes] = (exam.startTime || '00:00').split(':').map(Number);
      
      examStartTime.setUTCHours(hours);
      examStartTime.setUTCMinutes(minutes + tzOffset);
      examStartTime.setUTCSeconds(0);
      const examEndTime = new Date(examStartTime.getTime() + exam.duration * 60000);
      const now = new Date();

      if (now <= examEndTime) {
        ongoingExams.push({
          exam: exam,
          attempt: {
            id: attempt._id,
            startTime: attempt.startTime,
            timeRemaining: examEndTime - now,
            answeredCount: attempt.answers.filter(a => a.isAnswered).length,
            totalQuestions: attempt.answers.length,
            violations: attempt.violations.count
          }
        });
      }
    }

    res.json({
      success: true,
      data: ongoingExams
    });

  } catch (error) {
    console.error('Get ongoing exams error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Download exam report
exports.downloadExamReport = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found' 
      });
    }

    const results = await Result.find({ exam: exam._id })
      .populate('student', 'name rollNumber email group')
      .sort({ marksObtained: -1 });

    // Generate CSV
    const csvData = results.map((result, index) => ({
      'Rank': index + 1,
      'Student Name': result.student.name,
      'Roll Number': result.student.rollNumber,
      'Email': result.student.email,
      'Marks Obtained': result.marksObtained,
      'Total Marks': result.totalMarks,
      'Percentage': result.percentage.toFixed(2),
      'Result': result.isPass ? 'PASS' : 'FAIL',
      'Published': result.isPublished ? 'Yes' : 'No'
    }));

    const csv = convertToCSV(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${exam.name}-results.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Download exam report error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};