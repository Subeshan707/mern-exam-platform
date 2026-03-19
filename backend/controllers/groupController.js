const Group = require('../models/Group');
const Student = require('../models/Student');
const Result = require('../models/Result');
const ExamAttempt = require('../models/ExamAttempt');
const { validationResult } = require('express-validator');

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, year, batch } = req.query;
    
    let query = {};
    
    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (year) query.year = year;
    if (batch) query.batch = batch;
    
    const groups = await Group.find(query)
      .populate('createdBy', 'username')
      .populate('studentCount')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Group.countDocuments(query);

    res.json({
      success: true,
      data: groups,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('students', 'name rollNumber email');

    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
      });
    }

    res.json({
      success: true,
      data: group
    });

  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Create group
exports.createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const groupData = {
      ...req.body,
      createdBy: req.user._id
    };

    const group = new Group(groupData);
    await group.save();

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });

  } catch (error) {
    console.error('Create group error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Group with same name, year, batch and section already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Update group
// Update your updateGroup function
exports.updateGroup = async (req, res) => {
    try {
        console.log('📝 Updating group:', req.params.id);
        console.log('Update data:', req.body);

        // Don't allow updating certain fields
        const updates = { ...req.body };
        delete updates._id;
        delete updates.createdBy;
        delete updates.createdAt;
        
        updates.updatedAt = Date.now();

        const group = await Group.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!group) {
            console.log('❌ Group not found:', req.params.id);
            return res.status(404).json({ 
                success: false,
                message: 'Group not found' 
            });
        }

        console.log('✅ Group updated successfully');
        res.json({
            success: true,
            message: 'Group updated successfully',
            data: group
        });

    } catch (error) {
        console.error('❌ Update group error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                message: 'Group with same name, year, batch and section already exists' 
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

// Delete group
// Update your deleteGroup function
exports.deleteGroup = async (req, res) => {
    try {
        console.log('🗑️ Deleting group:', req.params.id);
        const { force } = req.query;
        
        // Check if group has students
        const studentCount = await Student.countDocuments({ group: req.params.id });
        console.log(`Found ${studentCount} students in this group`);
        
        if (studentCount > 0 && force !== 'true') {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot delete group with existing students. Use ?force=true to force delete or reassign students first.',
                data: {
                    studentCount: studentCount,
                    suggestion: 'Use PATCH /groups/:id/deactivate instead to mark as inactive'
                }
            });
        }

        // Force delete: clean up all students and their data
        if (force === 'true' && studentCount > 0) {
            const studentIds = await Student.find({ group: req.params.id }).distinct('_id');
            await Result.deleteMany({ student: { $in: studentIds } });
            await ExamAttempt.deleteMany({ student: { $in: studentIds } });
            await Student.deleteMany({ group: req.params.id });
            console.log(`Force deleted ${studentCount} students and their data`);
        }

        const group = await Group.findByIdAndDelete(req.params.id);

        if (!group) {
            console.log('❌ Group not found:', req.params.id);
            return res.status(404).json({ 
                success: false,
                message: 'Group not found' 
            });
        }

        console.log('✅ Group deleted successfully');
        res.json({
            success: true,
            message: 'Group deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete group error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// Add a new function to deactivate group instead of delete
exports.deactivateGroup = async (req, res) => {
    try {
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { isActive: false, updatedAt: Date.now() },
            { new: true }
        );

        if (!group) {
            return res.status(404).json({ 
                success: false,
                message: 'Group not found' 
            });
        }

        res.json({
            success: true,
            message: 'Group deactivated successfully',
            data: group
        });

    } catch (error) {
        console.error('❌ Deactivate group error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};
// Get group statistics
exports.getGroupStats = async (req, res) => {
  try {
    const stats = await Group.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'group',
          as: 'students'
        }
      },
      {
        $project: {
          name: 1,
          year: 1,
          batch: 1,
          section: 1,
          totalStudents: { $size: '$students' },
          activeStudents: {
            $size: {
              $filter: {
                input: '$students',
                as: 'student',
                cond: { $eq: ['$$student.isActive', true] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Group stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};