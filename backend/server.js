require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const path = require('path');

// Import middleware
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const studentRoutes = require('./routes/studentRoutes');
const examRoutes = require('./routes/examRoutes');
const resultRoutes = require('./routes/resultRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Import socket
const { initializeSocket } = require('./utils/socketManager');

// Import database connection
const connectDB = require('./config/database');

const app = express();
const httpServer = createServer(app);

// Connect to database
connectDB();

// Initialize Socket.io
const io = initializeSocket(httpServer);
app.set('io', io);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
const healthCheckHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};
app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Create default admin if not exists
// Create default admin if not exists
const createDefaultAdmin = async () => {
  try {
    const Admin = require('./models/Admin');
    
    // Check if any admin exists
    const adminExists = await Admin.findOne({ 
      $or: [
        { email: process.env.ADMIN_EMAIL },
        { username: 'admin' }
      ]
    });
    
    if (!adminExists) {
      const admin = new Admin({
        username: 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@examplatform.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'superadmin'
      });
      await admin.save();
      console.log('✅ Default admin created successfully');
      console.log('   Email:', process.env.ADMIN_EMAIL || 'admin@examplatform.com');
      console.log('   Password:', process.env.ADMIN_PASSWORD || 'Admin@123');
    } else {
      console.log('✅ Default admin already exists');
      console.log('   Email:', adminExists.email);
      console.log('   Using existing admin account');
    }
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      console.log('✅ Admin account already exists (duplicate key)');
    } else {
      console.error('❌ Unexpected error creating admin:', error.message);
    }
  }
};

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Create default admin
  await createDefaultAdmin();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, httpServer };