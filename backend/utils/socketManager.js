const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const ExamAttempt = require('../models/ExamAttempt');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join exam room
    socket.on('join-exam', async (examId, attemptId) => {
      try {
        socket.join(`exam-${examId}`);
        socket.join(`attempt-${attemptId}`);
        
        // Notify others in the exam room
        socket.to(`exam-${examId}`).emit('user-joined', {
          userId: socket.userId,
          timestamp: new Date()
        });

        console.log(`User ${socket.userId} joined exam ${examId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join exam' });
      }
    });

    // Record violation
    socket.on('violation', async (data) => {
      try {
        const { attemptId, type, details } = data;
        
        // Save violation to database
        const attempt = await ExamAttempt.findById(attemptId);
        if (attempt) {
          attempt.violations.count += 1;
          attempt.violations.details.push({
            type,
            timestamp: new Date(),
            details
          });
          await attempt.save();

          // Notify admin if violation count is high
          if (attempt.violations.count >= 3) {
            io.to('admin-room').emit('critical-violation', {
              attemptId,
              studentId: attempt.student,
              violationCount: attempt.violations.count,
              type
            });
          }

          // Send warning to student
          socket.emit('violation-recorded', {
            count: attempt.violations.count,
            maxViolations: 3,
            remaining: 3 - attempt.violations.count
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to record violation' });
      }
    });

    // Auto-save answer
    socket.on('auto-save', async (data) => {
      try {
        const { attemptId, answers } = data;
        
        const attempt = await ExamAttempt.findById(attemptId);
        if (attempt) {
          // Update answers
          answers.forEach(savedAnswer => {
            const answer = attempt.answers.find(a => 
              a.questionId.toString() === savedAnswer.questionId
            );
            if (answer) {
              answer.selectedOption = savedAnswer.selectedOption;
              answer.isVisited = savedAnswer.isVisited;
              answer.isAnswered = savedAnswer.isAnswered;
            }
          });
          
          attempt.autoSavedAt = new Date();
          await attempt.save();

          socket.emit('auto-save-success', {
            timestamp: attempt.autoSavedAt
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Auto-save failed' });
      }
    });

    // Submit exam
    socket.on('submit-exam', async (attemptId) => {
      try {
        socket.to(`attempt-${attemptId}`).emit('exam-submitted', {
          userId: socket.userId,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to submit exam' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`exam-${data.examId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      socket.broadcast.emit('user-left', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };