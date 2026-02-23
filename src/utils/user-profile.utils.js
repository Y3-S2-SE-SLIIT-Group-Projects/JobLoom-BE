import User from '../modules/users/user.model.js';
import RatingStats from '../modules/reviews/rating-stats.model.js';

/**
 * User Profile Helper
 * Utility to fetch user with their rating stats from separate collection
 */

/**
 * Get user profile with rating statistics
 * @param {ObjectId} userId - User ID
 * @returns {Object} User with ratingStats
 */
export const getUserWithRatingStats = async (userId) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    return null;
  }

  // Get rating stats from separate collection
  const ratingStats = await RatingStats.getOrCreate(userId);

  // Return user with ratingStats attached as virtual property
  const userObj = user.toObject();
  userObj.ratingStats = ratingStats.toObject();

  return userObj;
};

/**
 * Get multiple users with their rating statistics
 * @param {Array<ObjectId>} userIds - Array of user IDs
 * @returns {Array<Object>} Users with ratingStats
 */
export const getUsersWithRatingStats = async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } }).select('-password');

  if (!users || users.length === 0) {
    return [];
  }

  // Get all rating stats in one query
  const userIdList = users.map((u) => u._id);
  const ratingStatsList = await RatingStats.find({ userId: { $in: userIdList } });

  // Create a map for quick lookup
  const statsMap = new Map();
  ratingStatsList.forEach((stat) => {
    statsMap.set(stat.userId.toString(), stat.toObject());
  });

  // Attach rating stats to each user
  return users.map((user) => {
    const userObj = user.toObject();
    const userId = user._id.toString();

    userObj.ratingStats = statsMap.get(userId) || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    return userObj;
  });
};

export default {
  getUserWithRatingStats,
  getUsersWithRatingStats,
};
