import mongoose from 'mongoose';

/**
 * Job Model
 * Minimal schema for review validation
 */
const jobSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employer ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: ['farming', 'carpentry', 'tailoring', 'masonry', 'labor', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'closed', 'filled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'open',
    },
    salaryAmount: {
      type: Number,
      min: [0, 'Salary cannot be negative'],
    },
    positions: {
      type: Number,
      default: 1,
      min: [1, 'At least one position is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
jobSchema.index({ employerId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
