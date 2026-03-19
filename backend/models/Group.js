const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '2023', '2024', '2025', '2026']
  },
  batch: {
    type: String,
    required: [true, 'Batch is required'],
    enum: ['Batch A', 'Batch B', 'Batch C', 'Batch D', 'Morning', 'Evening']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['Section A', 'Section B', 'Section C', 'Section D', 'Section E']
  },
  department: {
    type: String,
    enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'OTHER']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for student count
groupSchema.virtual('studentCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'group',
  count: true
});

// Virtual for students
groupSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'group',
  options: { sort: { name: 1 } }
});

// Ensure unique combination
groupSchema.index({ name: 1, year: 1, batch: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Group', groupSchema);