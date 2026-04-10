import mongoose from 'mongoose';

/**
 * Application Model
 * Tracks job applications from job seekers to employer postings,
 * including status lifecycle, audit trail, and soft-delete support.
 */
const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    jobSeekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job seeker ID is required'],
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employer ID is required'],
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [1000, 'Cover letter cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    employerNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Employer notes cannot exceed 500 characters'],
    },
    interviewDate: {
      type: Date,
    },
    interviewType: {
      type: String,
      enum: {
        values: ['virtual', 'in_person'],
        message: '{VALUE} is not a valid interview type',
      },
    },
    jitsiRoomName: {
      type: String,
      trim: true,
    },
    interviewLocation: {
      type: String,
      trim: true,
      maxlength: [300, 'Interview location cannot exceed 300 characters'],
    },
    interviewLocationNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Interview location notes cannot exceed 500 characters'],
    },
    interviewDuration: {
      type: Number,
      min: [15, 'Interview must be at least 15 minutes'],
      max: [480, 'Interview cannot exceed 8 hours'],
      default: 30,
    },
    withdrawalReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Withdrawal reason cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate applications
applicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });

// Indexes for queries
applicationSchema.index({ status: 1 });
applicationSchema.index({ jobSeekerId: 1 });
applicationSchema.index({ employerId: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ employerId: 1, status: 1 });

// Pre-save hook: push to statusHistory whenever status is modified
applicationSchema.pre('save', function () {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this._statusChangedBy || undefined,
    });
  }
});

// Query helper to find active applications
applicationSchema.query.active = function () {
  return this.where({ isActive: true });
};

const Application = mongoose.model('Application', applicationSchema);

export default Application;
