import {
  calculateWeightedRating,
  calculateTrustScore,
  determineBadge,
  getRatingLevel,
  calculateReviewCompleteness,
} from '../../src/utils/rating.utils.js';

/**
 * Unit Tests for Review Service and Rating Utils
 * Testing business logic in isolation
 */

describe('Rating Utilities - Unit Tests', () => {
  describe('calculateWeightedRating', () => {
    test('should calculate average of all provided ratings', () => {
      const criteria = {
        rating: 5,
        workQuality: 4,
        communication: 5,
        punctuality: 4,
        paymentOnTime: 5,
      };

      const result = calculateWeightedRating(criteria);
      expect(result).toBe(4.6);
    });

    test('should handle partial criteria', () => {
      const criteria = {
        rating: 4,
        workQuality: 5,
      };

      const result = calculateWeightedRating(criteria);
      expect(result).toBe(4.5);
    });

    test('should return 0 for empty criteria', () => {
      const criteria = {};
      const result = calculateWeightedRating(criteria);
      expect(result).toBe(0);
    });

    test('should round to 1 decimal place', () => {
      const criteria = {
        rating: 4,
        workQuality: 4,
        communication: 5,
      };

      const result = calculateWeightedRating(criteria);
      expect(result).toBe(4.3);
    });

    test('should handle string ratings from multipart form submissions', () => {
      const criteria = {
        rating: '5',
        workQuality: '4',
        communication: '5',
      };

      const result = calculateWeightedRating(criteria);
      expect(result).toBe(4.7);
      expect(result).toBeLessThanOrEqual(5);
    });
  });

  describe('calculateTrustScore', () => {
    test('should calculate trust score correctly', () => {
      const user = {
        ratingStats: {
          averageRating: 4.5,
          totalReviews: 10,
        },
      };

      const result = calculateTrustScore(user);
      // (4.5 * 20) + (10 * 0.5) = 90 + 5 = 95
      expect(result).toBe(95);
    });

    test('should cap review contribution at 10 points', () => {
      const user = {
        ratingStats: {
          averageRating: 5,
          totalReviews: 50, // Would be 25 points without cap
        },
      };

      const result = calculateTrustScore(user);
      // (5 * 20) + min(50 * 0.5, 10) = 100 + 10 = 110 but capped at 105
      expect(result).toBeLessThanOrEqual(110);
    });

    test('should return 0 for user with no ratings', () => {
      const user = {
        ratingStats: {
          averageRating: 0,
          totalReviews: 0,
        },
      };

      const result = calculateTrustScore(user);
      expect(result).toBe(0);
    });

    test('should handle null user', () => {
      const result = calculateTrustScore(null);
      expect(result).toBe(0);
    });
  });

  describe('determineBadge', () => {
    test('should return Elite badge for 4.8+ rating with 20+ reviews', () => {
      const user = {
        ratingStats: {
          averageRating: 4.9,
          totalReviews: 25,
        },
      };

      const badge = determineBadge(user);
      expect(badge).toBe('Elite');
    });

    test('should return Top Rated badge for 4.5+ rating with 10+ reviews', () => {
      const user = {
        ratingStats: {
          averageRating: 4.6,
          totalReviews: 12,
        },
      };

      const badge = determineBadge(user);
      expect(badge).toBe('Top Rated');
    });

    test('should return Trusted badge for 4.0+ rating with 5+ reviews', () => {
      const user = {
        ratingStats: {
          averageRating: 4.2,
          totalReviews: 7,
        },
      };

      const badge = determineBadge(user);
      expect(badge).toBe('Trusted');
    });

    test('should return Rising Star badge for good rating with few reviews', () => {
      const user = {
        ratingStats: {
          averageRating: 4.5,
          totalReviews: 3,
        },
      };

      const badge = determineBadge(user);
      expect(badge).toBe('Rising Star');
    });

    test('should return null for no reviews', () => {
      const user = {
        ratingStats: {
          averageRating: 0,
          totalReviews: 0,
        },
      };

      const badge = determineBadge(user);
      expect(badge).toBeNull();
    });

    test('should return null for low rating', () => {
      const user = {
        ratingStats: {
          averageRating: 3.5,
          totalReviews: 10,
        },
      };

      const badge = determineBadge(user);
      expect(badge).toBeNull();
    });
  });

  describe('getRatingLevel', () => {
    test('should return Excellent for 4.5+', () => {
      expect(getRatingLevel(4.8)).toBe('Excellent');
      expect(getRatingLevel(5.0)).toBe('Excellent');
    });

    test('should return Very Good for 4.0-4.5', () => {
      expect(getRatingLevel(4.2)).toBe('Very Good');
    });

    test('should return Good for 3.5-4.0', () => {
      expect(getRatingLevel(3.7)).toBe('Good');
    });

    test('should return Average for 3.0-3.5', () => {
      expect(getRatingLevel(3.2)).toBe('Average');
    });

    test('should return Below Average for 2.0-3.0', () => {
      expect(getRatingLevel(2.5)).toBe('Below Average');
    });

    test('should return Poor for below 2.0', () => {
      expect(getRatingLevel(1.5)).toBe('Poor');
    });
  });

  describe('calculateReviewCompleteness', () => {
    test('should return 100% for fully completed review', () => {
      const review = {
        rating: 5,
        comment: 'Great work!',
        workQuality: 5,
        communication: 5,
        punctuality: 5,
        paymentOnTime: 5,
      };

      const completeness = calculateReviewCompleteness(review);
      expect(completeness).toBe(100);
    });

    test('should return 50% for half completed review', () => {
      const review = {
        rating: 5,
        workQuality: 5,
        communication: 5,
      };

      const completeness = calculateReviewCompleteness(review);
      expect(completeness).toBe(50);
    });

    test('should return 17% for minimal review', () => {
      const review = {
        rating: 5,
      };

      const completeness = calculateReviewCompleteness(review);
      expect(completeness).toBe(17); // Rounded from 16.67
    });

    test('should handle empty review', () => {
      const review = {};
      const completeness = calculateReviewCompleteness(review);
      expect(completeness).toBe(0);
    });
  });
});
