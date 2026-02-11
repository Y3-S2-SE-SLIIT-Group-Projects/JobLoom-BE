import mongoose from 'mongoose';
import User from '../users/user.model.js';

/**
 * Review Model
 * Complete schema for Review & Rating Component
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

// Post-save hook to update user rating statistics
reviewSchema.post('save', async function (doc) {
  try {
    await updateUserRatingStats(doc.revieweeId);
  } catch (error) {
    console.error('Error updating user rating stats:', error);
  }
});

// Post-update hook to recalculate ratings
reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    try {
      await updateUserRatingStats(doc.revieweeId);
    } catch (error) {
      console.error('Error updating user rating stats:', error);
    }
  }
});

// Post-delete hook to update ratings
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    try {
      await updateUserRatingStats(doc.revieweeId);
    } catch (error) {
      console.error('Error updating user rating stats:', error);
    }
  }
});

/**
 * Helper function to update user rating statistics
 * @param {ObjectId} userId - User ID to update stats for
 */
async function updateUserRatingStats(userId) {
  const Review = mongoose.model('Review');

  // Aggregate reviews for this user
  const stats = await Review.aggregate([
    {
      $match: {
        revieweeId: userId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        rating5: {
          $sum: {
            $cond: [{ $eq: ['$rating', 5] }, 1, 0],
          },
        },
        rating4: {
          $sum: {
            $cond: [{ $eq: ['$rating', 4] }, 1, 0],
          },
        },
        rating3: {
          $sum: {
            $cond: [{ $eq: ['$rating', 3] }, 1, 0],
          },
        },
        rating2: {
          $sum: {
            $cond: [{ $eq: ['$rating', 2] }, 1, 0],
          },
        },
        rating1: {
          $sum: {
            $cond: [{ $eq: ['$rating', 1] }, 1, 0],
          },
        },
      },
    },
  ]);

  // Update user's rating stats
  if (stats.length > 0) {
    const { averageRating, totalReviews, rating5, rating4, rating3, rating2, rating1 } = stats[0];

    await User.findByIdAndUpdate(userId, {
      'ratingStats.averageRating': Math.round(averageRating * 10) / 10, // Round to 1 decimal
      'ratingStats.totalReviews': totalReviews,
      'ratingStats.ratingDistribution': {
        5: rating5,
        4: rating4,
        3: rating3,
        2: rating2,
        1: rating1,
      },
    });
  } else {
    // No reviews, reset to defaults
    await User.findByIdAndUpdate(userId, {
      'ratingStats.averageRating': 0,
      'ratingStats.totalReviews': 0,
      'ratingStats.ratingDistribution': {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    });
  }
}

const Review = mongoose.model('Review', reviewSchema);

export default Review;
