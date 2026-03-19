const Student = require('../models/Student');
const Group = require('../models/Group');
const ExamAttempt = require('../models/ExamAttempt');
const Result = require('../models/Result');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      group, 
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let query = {};
    
    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (group) query.group = group;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const students = await Student.find(query)
      .populate('group', 'name year batch section')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('group', 'name year batch section department');

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Get student statistics
    const attempts = await ExamAttempt.countDocuments({ 
      student: student._id,
      status: 'completed'
    });

    const results = await Result.find({ 
      student: student._id,
      isPublished: true 
    }).populate('exam', 'name');

    res.json({
      success: true,
      data: {
        ...student.toJSON(),
        statistics: {
          totalExamsTaken: attempts,
          results: results,
          averagePercentage: results.length > 0 
            ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
            : 0,
          passedExams: results.filter(r => r.isPass).length
        }
      }
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Create student
// Update your createStudent function
exports.createStudent = async (req, res) => {
    try {
        console.log('📝 Creating student with data:', req.body);
        
        // Check if student already exists
        const existingStudent = await Student.findOne({
            $or: [
                { rollNumber: req.body.rollNumber?.toUpperCase() },
                { email: req.body.email?.toLowerCase() }
            ]
        });

        if (existingStudent) {
            console.log('❌ Student already exists');
            return res.status(400).json({
                success: false,
                message: existingStudent.rollNumber === req.body.rollNumber?.toUpperCase() 
                    ? 'Roll number already exists' 
                    : 'Email already exists'
            });
        }

        // Check if group exists
        if (!req.body.group) {
            return res.status(400).json({
                success: false,
                message: 'Group is required'
            });
        }

        const group = await Group.findById(req.body.group);
        if (!group) {
            console.log('❌ Group not found:', req.body.group);
            return res.status(400).json({ 
                success: false,
                message: 'Invalid group selected' 
            });
        }

        const student = new Student({
            ...req.body,
            rollNumber: req.body.rollNumber?.toUpperCase(),
            email: req.body.email?.toLowerCase()
        });

        await student.save();
        console.log('✅ Student created successfully with ID:', student._id);
        
        const populatedStudent = await Student.findById(student._id)
            .populate('group', 'name year batch section');

        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: populatedStudent
        });

    } catch (error) {
        console.error('❌ Create student error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                success: false,
                message: `${field} already exists` 
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};
// Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        rollNumber: req.body.rollNumber?.toUpperCase(),
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    ).populate('group', 'name year batch section');

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });

  } catch (error) {
    console.error('Update student error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `${field} already exists` 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { force } = req.query;

    // Check if student has exam attempts
    const attempts = await ExamAttempt.countDocuments({ student: req.params.id });
    
    if (attempts > 0 && force !== 'true') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete student with exam history. Use ?force=true to force delete or consider deactivating instead.' 
      });
    }

    // Force delete: clean up all related data
    if (force === 'true') {
      await Result.deleteMany({ student: req.params.id });
      await ExamAttempt.deleteMany({ student: req.params.id });
    }

    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Bulk create students
exports.bulkCreateStudents = async (req, res) => {
  try {
    const { students } = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide an array of students' 
      });
    }

    const results = {
      success: [],
      failed: [],
      totalProcessed: students.length
    };

    for (const studentData of students) {
      try {
        // Validate group
        const group = await Group.findById(studentData.group);
        if (!group) {
          results.failed.push({
            data: studentData,
            error: 'Invalid group ID'
          });
          continue;
        }

        // Create student
        const student = new Student({
          ...studentData,
          rollNumber: studentData.rollNumber.toUpperCase()
        });
        await student.save();
        
        results.success.push(await student.populate('group', 'name'));
        
      } catch (error) {
        results.failed.push({
          data: studentData,
          error: error.code === 11000 
            ? 'Duplicate roll number or email' 
            : error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.success.length} students, ${results.failed.length} failed`,
      data: results
    });

  } catch (error) {
    console.error('Bulk create students error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Toggle student status
exports.toggleStudentStatus = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    student.isActive = !student.isActive;
    await student.save();

    res.json({
      success: true,
      message: `Student ${student.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: student.isActive }
    });

  } catch (error) {
    console.error('Toggle student status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Reset student password
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    student.password = newPassword;
    await student.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get student exam history
exports.getStudentExamHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const attempts = await ExamAttempt.find({ student: req.params.id })
      .populate('exam', 'name date duration totalMarks')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const results = await Result.find({ 
      student: req.params.id,
      isPublished: true 
    }).populate('exam', 'name');

    const total = await ExamAttempt.countDocuments({ student: req.params.id });

    // Map results to attempts
    const history = attempts.map(attempt => {
      const result = results.find(r => 
        r.exam._id.toString() === attempt.exam._id.toString()
      );
      return {
        ...attempt.toJSON(),
        result: result || null
      };
    });

    res.json({
      success: true,
      data: history,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get student exam history error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};