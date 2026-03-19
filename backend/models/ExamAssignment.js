const mongoose = require('mongoose');

const examAssignmentSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam reference is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'started', 'completed', 'expired', 'cancelled'],
    default: 'pending'
  },
  startWindow: {
    start: Date,
    end: Date
  },
  timeExtension: {
    granted: {
      type: Boolean,
      default: false
    },
    minutes: Number,
    reason: String,
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    grantedAt: Date
  },
  attempts: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  currentAttempt: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Ensure either student or group is provided
examAssignmentSchema.pre('validate', function(next) {
  if (!this.student && !this.group) {
    next(new Error('Either student or group must be provided'));
  }
  next();
});

// Prevent duplicate assignments
examAssignmentSchema.index({ exam: 1, student: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { student: { $exists: true } }
});

examAssignmentSchema.index({ exam: 1, group: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { group: { $exists: true } }
});

module.exports = mongoose.model('ExamAssignment', examAssignmentSchema);