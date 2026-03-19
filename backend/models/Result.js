const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
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
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  isPass: {
    type: Boolean,
    required: true
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  },
  percentile: {
    type: Number,
    min: 0,
    max: 100
  },
  rank: {
    type: Number
  },
  totalStudents: {
    type: Number
  },
  sectionWiseMarks: [{
    section: String,
    marksObtained: Number,
    totalMarks: Number,
    percentage: Number
  }],
  questionAnalysis: [{
    questionId: mongoose.Schema.Types.ObjectId,
    isCorrect: Boolean,
    timeSpent: Number,
    marksObtained: Number
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  remarks: {
    type: String
  },
  certificateUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure one result per exam per student
resultSchema.index({ exam: 1, student: 1 }, { unique: true });

// Calculate grade based on percentage
resultSchema.pre('save', function(next) {
  if (this.percentage >= 90) this.grade = 'A+';
  else if (this.percentage >= 80) this.grade = 'A';
  else if (this.percentage >= 70) this.grade = 'B+';
  else if (this.percentage >= 60) this.grade = 'B';
  else if (this.percentage >= 50) this.grade = 'C+';
  else if (this.percentage >= 40) this.grade = 'C';
  else if (this.percentage >= 33) this.grade = 'D';
  else this.grade = 'F';
  
  next();
});

module.exports = mongoose.model('Result', resultSchema);