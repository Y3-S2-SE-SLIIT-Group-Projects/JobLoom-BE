/**
 * Rating Utility Functions
 * Pure calculation helpers - no database access.
 * Stats persistence is handled by rating-stats.service.js via the RatingStats collection.
 */

/**
 * Calculate weighted rating from multiple criteria
 * @param {Object} criteria - Rating criteria
 * @param {number} criteria.rating - Overall rating
 * @param {number} criteria.workQuality - Work quality rating
 * @param {number} criteria.communication - Communication rating
 * @param {number} criteria.punctuality - Punctuality rating
 * @param {number} criteria.paymentOnTime - Payment on time rating
 * @returns {number} Weighted average rating
 */
export const calculateWeightedRating = (criteria) => {
  const ratings = [];

  if (criteria.rating) ratings.push(criteria.rating);
  if (criteria.workQuality) ratings.push(criteria.workQuality);
  if (criteria.communication) ratings.push(criteria.communication);
  if (criteria.punctuality) ratings.push(criteria.punctuality);
  if (criteria.paymentOnTime) ratings.push(criteria.paymentOnTime);

  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  const average = sum / ratings.length;

  return Math.round(average * 10) / 10;
};

/**
 * Calculate trust score for a user
 * Formula: (averageRating * 20) + (totalReviews * 0.5)
 * Maximum score: 105 (5 stars * 20 + 10 reviews * 0.5)
 * @param {Object} ratingStats - Rating stats object (can be from RatingStats model or user.ratingStats)
 * @returns {number} Trust score
 */
export const calculateTrustScore = (ratingStats) => {
  if (!ratingStats) {
    return 0;
  }

  // Handle both direct ratingStats object and nested user.ratingStats
  const stats = ratingStats.ratingStats || ratingStats;
  const { averageRating, totalReviews } = stats;

  const ratingScore = (averageRating || 0) * 20;
  const reviewScore = Math.min((totalReviews || 0) * 0.5, 10); // Cap review contribution at 10

  const trustScore = ratingScore + reviewScore;

  // Round to 1 decimal place
  return Math.round(trustScore * 10) / 10;
};

/**
 * Determine badge for user based on rating and reviews
 * @param {Object} ratingStats - Rating stats object (can be from RatingStats model or user.ratingStats)
 * @returns {string|null} Badge name or null
 */
export const determineBadge = (ratingStats) => {
  if (!ratingStats) {
    return null;
  }

  // Handle both direct ratingStats object and nested user.ratingStats
  const stats = ratingStats.ratingStats || ratingStats;
  const { averageRating, totalReviews } = stats;

  // No badge if no reviews
  if (totalReviews === 0) {
    return null;
  }

  // Elite badge: 4.8+ rating with 20+ reviews
  if (averageRating >= 4.8 && totalReviews >= 20) {
    return 'Elite';
  }

  // Top Rated badge: 4.5+ rating with 10+ reviews
  if (averageRating >= 4.5 && totalReviews >= 10) {
    return 'Top Rated';
  }

  // Trusted badge: 4.0+ rating with 5+ reviews
  if (averageRating >= 4.0 && totalReviews >= 5) {
    return 'Trusted';
  }

  // Rising Star badge: Good rating but few reviews (4.0+ with 2-4 reviews)
  if (averageRating >= 4.0 && totalReviews >= 2 && totalReviews < 5) {
    return 'Rising Star';
  }

  return null;
};

/**
 * Get rating level description
 * @param {number} rating - Rating value (1-5)
 * @returns {string} Rating level
 */
export const getRatingLevel = (rating) => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Average';
  if (rating >= 2.0) return 'Below Average';
  return 'Poor';
};

/**
 * Calculate review completion percentage
 * How many criteria were filled out in the review
 * @param {Object} review - Review object
 * @returns {number} Completion percentage (0-100)
 */
export const calculateReviewCompleteness = (review) => {
  const criteria = [
    'rating',
    'comment',
    'workQuality',
    'communication',
    'punctuality',
    'paymentOnTime',
  ];

  let filledCount = 0;
  criteria.forEach((field) => {
    if (review[field] !== undefined && review[field] !== null && review[field] !== '') {
      filledCount++;
    }
  });

  return Math.round((filledCount / criteria.length) * 100);
};

export default {
  calculateWeightedRating,
  calculateTrustScore,
  determineBadge,
  getRatingLevel,
  calculateReviewCompleteness,
};
