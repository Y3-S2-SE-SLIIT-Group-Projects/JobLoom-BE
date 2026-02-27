import mongoose from 'mongoose';
import logger from '../../config/logger.config.js';
import { EventEmitter } from 'events';

// Event emitter for rating stats update failures
export const ratingStatsEventEmitter = new EventEmitter();

/**
 * Review Model
 * Schema definition only - business logic extracted to service layer
 * Follows Single Responsibility Principle
 */
const reviewSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required'],
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee ID is required'],
    },
    reviewerType: {
      type: String,
      enum: {
        values: ['job_seeker', 'employer'],
        message: '{VALUE} is not a valid reviewer type',
      },
      required: [true, 'Reviewer type is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    // Detailed criteria ratings
    workQuality: {
      type: Number,
      min: [1, 'Work quality rating must be at least 1'],
      max: [5, 'Work quality rating cannot exceed 5'],
    },
    communication: {
      type: Number,
      min: [1, 'Communication rating must be at least 1'],
      max: [5, 'Communication rating cannot exceed 5'],
    },
    punctuality: {
      type: Number,
      min: [1, 'Punctuality rating must be at least 1'],
      max: [5, 'Punctuality rating cannot exceed 5'],
    },
    paymentOnTime: {
      type: Number,
      min: [1, 'Payment on time rating must be at least 1'],
      max: [5, 'Payment on time rating cannot exceed 5'],
    },
    wouldRecommend: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false, // Don't include in queries by default
    },
    reportedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: {
          type: String,
          trim: true,
          maxlength: [500, 'Report reason cannot exceed 500 characters'],
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate reviews
reviewSchema.index({ jobId: 1, reviewerId: 1, revieweeId: 1 }, { unique: true });

// Index for querying reviews of a user
reviewSchema.index({ revieweeId: 1, isDeleted: 1 });

// Index for filtering deleted reviews
reviewSchema.index({ isDeleted: 1 });

// Index for reviewer type filtering
reviewSchema.index({ reviewerType: 1 });

// Index for sorting by date
reviewSchema.index({ createdAt: -1 });

// Query helper to exclude deleted reviews
reviewSchema.query.active = function () {
  return this.where({ isDeleted: false });
};

// Post-save hook to trigger rating stats update
// Delegates to service layer instead of containing business logic
reviewSchema.post('save', async function (doc) {
  try {
    // Import dynamically to avoid circular dependency
    const { updateUserRatingStats } = await import('./rating-stats.service.js');
    await updateUserRatingStats(doc.revieweeId);
  } catch (error) {
    logger.error('Failed to update user rating stats after review save', {
      reviewId: doc._id,
      revieweeId: doc.revieweeId,
      error: error.message,
      stack: error.stack,
    });
    // Emit event for monitoring/alerting systems
    ratingStatsEventEmitter.emit('updateFailed', {
      operation: 'save',
      reviewId: doc._id,
      revieweeId: doc.revieweeId,
      error,
    });
  }
});

// Post-update hook to recalculate ratings
reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    try {
      const { updateUserRatingStats } = await import('./rating-stats.service.js');
      await updateUserRatingStats(doc.revieweeId);
    } catch (error) {
      logger.error('Failed to update user rating stats after review update', {
        reviewId: doc._id,
        revieweeId: doc.revieweeId,
        error: error.message,
        stack: error.stack,
      });
      ratingStatsEventEmitter.emit('updateFailed', {
        operation: 'update',
        reviewId: doc._id,
        revieweeId: doc.revieweeId,
        error,
      });
    }
  }
});

// Post-delete hook to update ratings
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    try {
      const { updateUserRatingStats } = await import('./rating-stats.service.js');
      await updateUserRatingStats(doc.revieweeId);
    } catch (error) {
      logger.error('Failed to update user rating stats after review delete', {
        reviewId: doc._id,
        revieweeId: doc.revieweeId,
        error: error.message,
        stack: error.stack,
      });
      ratingStatsEventEmitter.emit('updateFailed', {
        operation: 'delete',
        reviewId: doc._id,
        revieweeId: doc.revieweeId,
        error,
      });
    }
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
