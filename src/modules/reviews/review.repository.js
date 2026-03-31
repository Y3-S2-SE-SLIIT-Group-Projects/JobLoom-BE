import Review from './review.model.js';

/**
 * Review Repository
 * Data access layer for review operations
 * Abstracts database queries from business logic
 */

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @returns {Promise<Object>} Created review
 */
export const createReview = async (reviewData) => {
  return await Review.create(reviewData);
};

/**
 * Find review by ID
 * @param {ObjectId} reviewId - Review ID
 * @param {Object} options - Query options
 * @returns {Promise<Object|null>} Review or null
 */
export const findReviewById = async (reviewId, options = {}) => {
  const query = Review.findById(reviewId);

  if (options.includeDeleted !== true) {
    query.active();
  }

  if (options.populate) {
    options.populate.forEach((pop) => {
      query.populate(pop);
    });
  }

  return await query;
};

/**
 * Find review by criteria
 * @param {Object} criteria - Search criteria
 * @param {Object} options - Query options
 * @returns {Promise<Object|null>} Review or null
 */
export const findReview = async (criteria, options = {}) => {
  const query = Review.findOne(criteria);

  if (options.populate) {
    options.populate.forEach((pop) => {
      query.populate(pop);
    });
  }

  return await query;
};

/**
 * Find multiple reviews
 * @param {Object} criteria - Search criteria
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of reviews
 */
export const findReviews = async (criteria, options = {}) => {
  const query = Review.find(criteria);

  if (options.populate) {
    options.populate.forEach((pop) => {
      query.populate(pop);
    });
  }

  if (options.sort) {
    query.sort(options.sort);
  }

  if (options.skip) {
    query.skip(options.skip);
  }

  if (options.limit) {
    query.limit(options.limit);
  }

  return await query;
};

/**
 * Update review by ID
 * @param {ObjectId} reviewId - Review ID
 * @param {Object} updateData - Data to update
 * @param {Object} options - Update options
 * @returns {Promise<Object|null>} Updated review or null
 */
export const updateReviewById = async (reviewId, updateData, options = {}) => {
  const updateOptions = {
    returnDocument: 'after',
    runValidators: true,
    ...options,
  };

  const query = Review.findByIdAndUpdate(reviewId, updateData, updateOptions);

  if (options.populate) {
    options.populate.forEach((pop) => {
      query.populate(pop);
    });
  }

  return await query;
};

/**
 * Soft delete review (set isDeleted flag)
 * @param {ObjectId} reviewId - Review ID
 * @returns {Promise<Object|null>} Updated review or null
 */
export const softDeleteReview = async (reviewId) => {
  return await Review.findByIdAndUpdate(reviewId, { isDeleted: true }, { returnDocument: 'after' });
};

/**
 * Hard delete review (permanently remove)
 * @param {ObjectId} reviewId - Review ID
 * @returns {Promise<Object|null>} Deleted review or null
 */
export const hardDeleteReview = async (reviewId) => {
  return await Review.findByIdAndDelete(reviewId);
};

/**
 * Count reviews matching criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<number>} Count of reviews
 */
export const countReviews = async (criteria) => {
  return await Review.countDocuments(criteria);
};

/**
 * Get reviews for a user (reviewee)
 * @param {ObjectId} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Reviews and pagination data
 */
export const getReviewsForUser = async (userId, filters = {}) => {
  const { reviewerType, page = 1, limit = 20, sort = '-createdAt' } = filters;

  const criteria = {
    revieweeId: userId,
    isDeleted: false,
  };

  if (reviewerType) {
    criteria.reviewerType = reviewerType;
  }

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    findReviews(criteria, {
      populate: [
        { path: 'reviewerId', select: 'firstName lastName email role' },
        { path: 'jobId', select: 'title' },
      ],
      sort,
      skip,
      limit,
    }),
    countReviews(criteria),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get reviews for a job
 * @param {ObjectId} jobId - Job ID
 * @returns {Promise<Array>} Array of reviews
 */
export const getReviewsForJob = async (jobId) => {
  return await findReviews(
    { jobId, isDeleted: false },
    {
      populate: [
        { path: 'reviewerId', select: 'firstName lastName email role' },
        { path: 'revieweeId', select: 'firstName lastName email role' },
      ],
      sort: { createdAt: -1 },
    }
  );
};

/**
 * Check if review exists with criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<boolean>} True if review exists
 */
export const reviewExists = async (criteria) => {
  const count = await countReviews(criteria);
  return count > 0;
};

/**
 * Aggregate reviews for a user (for rating stats calculation)
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Array>} Aggregation results
 */
export const aggregateReviews = async (userId) => {
  return await Review.aggregate([
    {
      $match: {
        revieweeId: userId,
        isDeleted: false,
      },
    },
    {
      // Ratings can be decimals (e.g. 4.3); map them to nearest star bucket for distribution bars.
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
};

/**
 * Get distinct reviewee IDs
 * @returns {Promise<Array>} Array of reviewee IDs
 */
export const getDistinctReviewees = async () => {
  return await Review.distinct('revieweeId');
};

export default {
  createReview,
  findReviewById,
  findReview,
  findReviews,
  updateReviewById,
  softDeleteReview,
  hardDeleteReview,
  countReviews,
  getReviewsForUser,
  getReviewsForJob,
  reviewExists,
  aggregateReviews,
  getDistinctReviewees,
};
