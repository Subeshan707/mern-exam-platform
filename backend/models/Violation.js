const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: true
  },
  type: {
    type: String,
    enum: [
      'fullscreen-exit',
      'tab-switch',
      'browser-minimize',
      'navigation-away',
      'right-click',
      'copy-attempt',
      'paste-attempt',
      'multiple-ip',
      'suspicious-activity',
      'face-not-detected',
      'multiple-faces-detected',
      'audio-detected',
      'mobile-detected'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    screenResolution: String,
    browserInfo: String,
    osInfo: String,
    previousTab: String,
    currentTab: String,
    timeOffFullscreen: Number,
    additionalData: mongoose.Schema.Types.Mixed
  },
  action: {
    warningGiven: {
      type: Boolean,
      default: false
    },
    warningCount: {
      type: Number,
      default: 1
    },
    autoSubmit: {
      type: Boolean,
      default: false
    },
    terminated: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    reviewedAt: Date,
    reviewNotes: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
violationSchema.index({ student: 1, exam: 1, timestamp: -1 });
violationSchema.index({ severity: 1, timestamp: -1 });

module.exports = mongoose.model('Violation', violationSchema);