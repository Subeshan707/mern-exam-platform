const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.role === 'admin' || decoded.role === 'superadmin') {
      user = await Admin.findById(decoded.id).select('-password -refreshToken');
    } else {
      user = await Student.findById(decoded.id).select('-password -refreshToken').populate('group');
    }
    
    if (!user || !user.isActive) {
      throw new Error();
    }

    req.user = user;
    req.userRole = decoded.role;
    req.token = token;
    next();
    
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Please authenticate' 
    });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin only.' 
    });
  }
  next();
};

const authorizeStudent = (req, res, next) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Students only.' 
    });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin, authorizeStudent };