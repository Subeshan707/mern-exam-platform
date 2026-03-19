const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOption: {
    type: String,
    enum: ['A', 'B', 'C', 'D', null],
    default: null
  },
  isVisited: {
    type: Boolean,
    default: false
  },
  isAnswered: {
    type: Boolean,
    default: false
  },
  isMarkedForReview: {
    type: Boolean,
    default: false
  },
  timeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  marksObtained: {
    type: Number,
    default: 0
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
});

const violationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['fullscreen-exit', 'tab-switch', 'browser-minimize', 'navigation-away', 'right-click', 'copy-attempt'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String
  },
  ipAddress: String,
  userAgent: String
});

const examAttemptSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAssignment'
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  answers: [answerSchema],
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'auto-submitted', 'abandoned', 'terminated'],
    default: 'in-progress'
  },
  violations: {
    count: {
      type: Number,
      default: 0
    },
    details: [violationSchema]
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  result: {
    type: String,
    enum: ['pass', 'fail', 'pending'],
    default: 'pending'
  },
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    browser: String,
    os: String,
    screenResolution: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    country: String
  },
  networkStatus: [{
    status: String,
    timestamp: Date
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  autoSavedAt: {
    type: Date
  },
  submittedAt: Date,
  timeTaken: Number // in seconds
}, {
  timestamps: true
});

// Update lastActive on save
examAttemptSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// Calculate time taken before saving if completed
examAttemptSchema.pre('save', function(next) {
  if (this.status === 'completed' && this.endTime) {
    this.timeTaken = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Ensure one active attempt per student per exam
examAttemptSchema.index({ exam: 1, student: 1, status: 1 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);