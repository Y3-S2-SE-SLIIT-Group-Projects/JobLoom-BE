import RatingStats from './rating-stats.model.js';

/**
 * Rating Stats Service
 * Business logic for rating statistics operations
 * Follows Dependency Inversion Principle - depends on abstractions not concrete implementations
 */

/**
 * Calculate and update rating statistics for a user
 * @param {ObjectId} userId - User ID to update stats for
 * @param {Object} reviewRepository - Review repository instance (dependency injection)
 * @returns {Promise<Object>} Updated rating stats
 */
export const updateUserRatingStats = async (userId, reviewRepository = null) => {
  // Use injected repository or fallback to direct model access for backwards compatibility
  let stats;

  if (reviewRepository && reviewRepository.aggregateReviews) {
    stats = await reviewRepository.aggregateReviews(userId);
  } else {
    // Fallback: direct model access (for backwards compatibility)
    const mongoose = await import('mongoose');
    const Review = mongoose.default.model('Review');

    stats = await Review.aggregate([
      {
        $match: {
          revieweeId: userId,
          isDeleted: false,
        },
      },
      {
        // Ratings may be decimals; normalize into star buckets for summary distribution.
        $project: {
          roundedRating: { $round: ['$rating', 0] },
          rating: 1,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating5: {
            $sum: {
              $cond: [{ $eq: ['$roundedRating', 5] }, 1, 0],
            },
          },
          rating4: {
            $sum: {
              $cond: [{ $eq: ['$roundedRating', 4] }, 1, 0],
            },
          },
          rating3: {
            $sum: {
              $cond: [{ $eq: ['$roundedRating', 3] }, 1, 0],
            },
          },
          rating2: {
            $sum: {
              $cond: [{ $eq: ['$roundedRating', 2] }, 1, 0],
            },
          },
          rating1: {
            $sum: {
              $cond: [{ $eq: ['$roundedRating', 1] }, 1, 0],
            },
          },
        },
      },
    ]);
  }

  // Prepare update data
  let updateData;

  if (stats.length > 0) {
    const { averageRating, totalReviews, rating5, rating4, rating3, rating2, rating1 } = stats[0];

    updateData = {
      userId,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
      ratingDistribution: {
        5: rating5,
        4: rating4,
        3: rating3,
        2: rating2,
        1: rating1,
      },
      lastCalculated: new Date(),
    };
  } else {
    // No reviews, reset to defaults
    updateData = {
      userId,
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
      lastCalculated: new Date(),
    };
  }

  // Update or create rating stats
  const updatedStats = await RatingStats.findOneAndUpdate({ userId }, updateData, {
    upsert: true,
    returnDocument: 'after',
  });

  return updatedStats;
};

/**
 * Get rating statistics for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} Rating stats
 */
export const getRatingStatsForUser = async (userId) => {
  const stats = await RatingStats.getOrCreate(userId);
  return stats;
};

/**
 * Batch update rating stats for multiple users
 * Useful for background jobs or bulk operations
 * @param {Array<ObjectId>} userIds - Array of user IDs
 * @param {Object} reviewRepository - Review repository instance (optional)
 * @returns {Promise<Object>} Update summary
 */
export const batchUpdateRatingStats = async (userIds, reviewRepository = null) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const userId of userIds) {
    try {
      await updateUserRatingStats(userId, reviewRepository);
      results.success++;
    } catch (error) {
      results.failed++;
      const errorDetails = {
        userId,
        error: error.message,
        stack: error.stack,
      };
      results.errors.push(errorDetails);
      // Log error for monitoring
      console.error(`Failed to update rating stats for user ${userId}:`, errorDetails);
    }
  }

  // Log summary
  if (results.failed > 0) {
    console.warn(`Batch update completed: ${results.success} succeeded, ${results.failed} failed`);
  }

  return results;
};

/**
 * Recalculate all rating stats
 * WARNING: Use with caution - can be expensive operation
 * @param {Object} reviewRepository - Review repository instance (optional)
 * @returns {Promise<Object>} Recalculation summary
 */
export const recalculateAllRatingStats = async (reviewRepository = null) => {
  let reviewees;

  if (reviewRepository && reviewRepository.getDistinctReviewees) {
    reviewees = await reviewRepository.getDistinctReviewees();
  } else {
    // Fallback
    const mongoose = await import('mongoose');
    const Review = mongoose.default.model('Review');
    reviewees = await Review.distinct('revieweeId');
  }

  return await batchUpdateRatingStats(reviewees, reviewRepository);
};

export default {
  updateUserRatingStats,
  getRatingStatsForUser,
  batchUpdateRatingStats,
  recalculateAllRatingStats,
};
