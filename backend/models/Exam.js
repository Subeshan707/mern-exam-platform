const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: {
    A: { type: String, required: [true, 'Option A is required'] },
    B: { type: String, required: [true, 'Option B is required'] },
    C: { type: String, required: [true, 'Option C is required'] },
    D: { type: String, required: [true, 'Option D is required'] }
  },
  correctAnswer: {
    type: String,
    required: [true, 'Correct answer is required'],
    enum: ['A', 'B', 'C', 'D']
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0, 'Marks cannot be negative'],
    max: [100, 'Marks cannot exceed 100']
  },
  explanation: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
});

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true,
    unique: true,
    maxlength: [200, 'Exam name cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  instructions: {
    type: String,
    default: 'Read each question carefully before answering. You cannot go back to previous questions once submitted.'
  },
  date: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 480 minutes (8 hours)']
  },
  passMark: {
    type: Number,
    required: [true, 'Pass mark is required'],
    min: [0, 'Pass mark cannot be negative']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [0, 'Total marks cannot be negative']
  },
  questions: [questionSchema],
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    enableFullScreen: {
      type: Boolean,
      default: true
    },
    enableTabSwitchDetection: {
      type: Boolean,
      default: true
    },
    autoSubmitViolations: {
      type: Boolean,
      default: true
    },
    maxViolations: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    showResultImmediately: {
      type: Boolean,
      default: false
    },
    allowReview: {
      type: Boolean,
      default: false
    },
    negativeMarking: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'in-progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  category: {
    type: String,
    enum: ['Mid Term', 'Final Term', 'Quiz', 'Assignment', 'Practice'],
    default: 'Quiz'
  },
  tags: [String],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
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

// Calculate total marks from questions before saving
examSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  }
  next();
});

// Index for search
examSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Exam', examSchema);