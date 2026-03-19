const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Group = require('../models/Group');
const { validationResult } = require('express-validator');
const constants = require('../config/constants');

// Generate tokens
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: constants.JWT.EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { id: userId, role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: constants.JWT.REFRESH_EXPIRES_IN }
  );
  
  return { accessToken, refreshToken };
};

// Admin Register
exports.adminRegister = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    const existingAdmin = await Admin.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.trim() }
      ]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: existingAdmin.email === email.toLowerCase()
          ? 'Email already in use'
          : 'Username already in use'
      });
    }

    const admin = await Admin.create({
      username: username.trim(),
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });

    const { accessToken, refreshToken } = generateTokens(admin._id, 'admin');
    admin.refreshToken = refreshToken;
    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: 'admin'
        }
      }
    });
  } catch (error) {
    console.error('Admin register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Student Register
exports.studentRegister = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, rollNumber, email, password, group } = req.body;

    const existingStudent = await Student.findOne({
      $or: [
        { rollNumber: rollNumber.toUpperCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: existingStudent.rollNumber === rollNumber.toUpperCase()
          ? 'Roll number already exists'
          : 'Email already in use'
      });
    }

    const groupExists = await Group.findById(group);
    if (!groupExists || !groupExists.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive group'
      });
    }

    const student = await Student.create({
      name: name.trim(),
      rollNumber: rollNumber.toUpperCase(),
      email: email.toLowerCase(),
      password,
      group
    });

    const populatedStudent = await Student.findById(student._id).populate('group');

    const { accessToken, refreshToken } = generateTokens(student._id, 'student');
    student.refreshToken = refreshToken;
    await student.save();

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: populatedStudent._id,
          name: populatedStudent.name,
          rollNumber: populatedStudent.rollNumber,
          email: populatedStudent.email,
          group: populatedStudent.group,
          role: 'student'
        }
      }
    });
  } catch (error) {
    console.error('Student register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated. Please contact super admin.' 
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(admin._id, 'admin');

    // Save refresh token
    admin.refreshToken = refreshToken;
    await admin.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: 'admin'
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

// Student Login
exports.studentLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { rollNumber, password } = req.body;
    
    // Find student by roll number
    const student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() })
      .populate('group');
      
    if (!student) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if account is active
    if (!student.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(student._id, 'student');

    // Save refresh token
    student.refreshToken = refreshToken;
    await student.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          email: student.email,
          group: student.group,
          role: 'student'
        }
      }
    });

  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false,
        message: 'Refresh token required' 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Find user
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findOne({ 
        _id: decoded.id, 
        refreshToken,
        isActive: true 
      });
    } else {
      user = await Student.findOne({ 
        _id: decoded.id, 
        refreshToken,
        isActive: true 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid refresh token' 
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id, decoded.role);

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      data: tokens
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid or expired refresh token' 
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Clear refresh token from database
      if (req.userRole === 'admin') {
        await Admin.findByIdAndUpdate(req.user._id, { refreshToken: null });
      } else {
        await Student.findByIdAndUpdate(req.user._id, { refreshToken: null });
      }
    }

    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during logout' 
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user
    let user;
    if (req.userRole === 'admin') {
      user = await Admin.findById(req.user._id);
    } else {
      user = await Student.findById(req.user._id);
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ 
      success: true,
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    let user;
    if (role === 'admin') {
      user = await Admin.findOne({ email });
    } else {
      user = await Student.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset link
    // await sendResetEmail(user.email, resetToken);

    res.json({ 
      success: true,
      message: 'Password reset instructions sent to your email' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};