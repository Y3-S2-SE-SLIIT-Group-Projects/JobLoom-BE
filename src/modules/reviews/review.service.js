import Review from './review.model.js';
import Application from '../applications/application.model.js';
import User from '../users/user.model.js';
import Job from '../jobs/job.model.js';
import HttpException from '../../models/http-exception.js';
import {
  calculateWeightedRating,
  calculateTrustScore,
  determineBadge,
} from '../../utils/rating.utils.js';

/**
 * Review Service
 * Business logic for review operations
 */

/**
 * Check if user can review another user for a specific job
 * @param {ObjectId} reviewerId - ID of user giving review
 * @param {ObjectId} revieweeId - ID of user being reviewed
 * @param {ObjectId} jobId - Job ID
 * @returns {boolean} Can user review
 */
export const canUserReview = async (reviewerId, revieweeId, jobId) => {
  // Check if there's an accepted application involving both users for this job
  const application = await Application.findOne({
    jobId,
    $or: [
      // Reviewer is job seeker, reviewee is employer
      { jobSeekerId: reviewerId, employerId: revieweeId, status: 'accepted' },
      // Reviewer is employer, reviewee is job seeker
      { employerId: reviewerId, jobSeekerId: revieweeId, status: 'accepted' },
    ],
  });

  return !!application;
};

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @returns {Object} Created review
 */
export const createReview = async (reviewData) => {
  const { reviewerId, revieweeId, jobId } = reviewData;

  // Check if reviewer and reviewee are different
  if (reviewerId.toString() === revieweeId.toString()) {
    throw new HttpException(400, 'You cannot review yourself');
  }

  // Check if user can review (has accepted application)
  const canReview = await canUserReview(reviewerId, revieweeId, jobId);
  if (!canReview) {
    throw new HttpException(403, 'You can only review users you have worked with on accepted jobs');
  }

  // Check for duplicate review
  const existingReview = await Review.findOne({
    reviewerId,
    revieweeId,
    jobId,
  });

  if (existingReview) {
    throw new HttpException(409, 'You have already reviewed this user for this job');
  }

  // Verify job exists
  const job = await Job.findById(jobId);
  if (!job) {
    throw new HttpException(404, 'Job not found');
  }

  // Verify reviewee exists
  const reviewee = await User.findById(revieweeId);
  if (!reviewee) {
    throw new HttpException(404, 'Reviewee not found');
  }

  // Calculate weighted rating if multiple criteria provided
  if (
    reviewData.workQuality ||
    reviewData.communication ||
    reviewData.punctuality ||
    reviewData.paymentOnTime
  ) {
    reviewData.rating = calculateWeightedRating(reviewData);
  }

  // Create review
  const review = await Review.create(reviewData);

  // Populate related data
  await review.populate([
    { path: 'reviewerId', select: 'firstName lastName email role' },
    { path: 'revieweeId', select: 'firstName lastName email role ratingStats' },
    { path: 'jobId', select: 'title' },
  ]);

  return review;
};

/**
 * Get review by ID
 * @param {ObjectId} reviewId - Review ID
 * @returns {Object} Review
 */
export const getReviewById = async (reviewId) => {
  const review = await Review.findById(reviewId)
    .active()
    .populate('reviewerId', 'firstName lastName email role')
    .populate('revieweeId', 'firstName lastName email role ratingStats')
    .populate('jobId', 'title description');

  if (!review) {
    throw new HttpException(404, 'Review not found');
  }

  return review;
};

/**
 * Update a review
 * @param {ObjectId} reviewId - Review ID
 * @param {ObjectId} userId - User ID (must be reviewer)
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated review
 */
export const updateReview = async (reviewId, userId, updateData) => {
  // Find review
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new HttpException(404, 'Review not found');
  }

  if (review.isDeleted) {
    throw new HttpException(404, 'Review not found');
  }

  // Verify ownership
  if (review.reviewerId.toString() !== userId.toString()) {
    throw new HttpException(403, 'You can only edit your own reviews');
  }

  // Check 7-day edit window
  const daysSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation > 7) {
    throw new HttpException(403, 'Reviews can only be edited within 7 days of creation');
  }

  // Check 24-hour rating change window
  const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation > 24 && updateData.rating && updateData.rating !== review.rating) {
    throw new HttpException(403, 'Rating cannot be changed after 24 hours');
  }

  // Allowed fields to update
  const allowedUpdates = [
    'rating',
    'comment',
    'workQuality',
    'communication',
    'punctuality',
    'paymentOnTime',
    'wouldRecommend',
  ];

  // Filter update data
  const updates = {};
  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  }

  // Recalculate weighted rating if criteria changed
  if (
    updates.workQuality ||
    updates.communication ||
    updates.punctuality ||
    updates.paymentOnTime
  ) {
    updates.rating = calculateWeightedRating({ ...review.toObject(), ...updates });
  }

  // Update review
  const updatedReview = await Review.findByIdAndUpdate(reviewId, updates, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'reviewerId', select: 'firstName lastName email role' },
    { path: 'revieweeId', select: 'firstName lastName email role ratingStats' },
    { path: 'jobId', select: 'title' },
  ]);

  return updatedReview;
};

/**
 * Delete a review (soft delete)
 * @param {ObjectId} reviewId - Review ID
 * @param {ObjectId} userId - User ID
 * @param {boolean} isAdmin - Is user an admin
 * @returns {Object} Success message
 */
export const deleteReview = async (reviewId, userId, isAdmin = false) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new HttpException(404, 'Review not found');
  }

  if (review.isDeleted) {
    throw new HttpException(404, 'Review not found');
  }

  // Verify ownership or admin
  if (!isAdmin && review.reviewerId.toString() !== userId.toString()) {
    throw new HttpException(403, 'You can only delete your own reviews');
  }

  // Soft delete
  review.isDeleted = true;
  await review.save();

  return { message: 'Review deleted successfully' };
};

/**
 * Get reviews for a user
 * @param {ObjectId} userId - User ID (reviewee)
 * @param {Object} filters - Filter options
 * @returns {Object} Reviews and metadata
 */
export const getReviewsForUser = async (userId, filters = {}) => {
  const { reviewerType, page = 1, limit = 20, sort = '-createdAt' } = filters;

  const query = {
    revieweeId: userId,
    isDeleted: false,
  };

  if (reviewerType) {
    query.reviewerType = reviewerType;
  }

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('reviewerId', 'firstName lastName email role')
      .populate('jobId', 'title')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(query),
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
 * @returns {Array} Reviews
 */
export const getReviewsForJob = async (jobId) => {
  const reviews = await Review.find({ jobId, isDeleted: false })
    .populate('reviewerId', 'firstName lastName email role')
    .populate('revieweeId', 'firstName lastName email role')
    .sort({ createdAt: -1 });

  return reviews;
};

/**
 * Get user rating statistics
 * @param {ObjectId} userId - User ID
 * @returns {Object} Rating statistics with badge
 */
export const getUserRatingStats = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new HttpException(404, 'User not found');
  }

  const trustScore = calculateTrustScore(user);
  const badge = determineBadge(user);

  return {
    ...user.ratingStats.toObject(),
    trustScore,
    badge,
  };
};

/**
 * Report a review
 * @param {ObjectId} reviewId - Review ID
 * @param {Object} reportData - Report data
 * @returns {Object} Updated review
 */
export const reportReview = async (reviewId, reportData) => {
  const { userId, reason } = reportData;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new HttpException(404, 'Review not found');
  }

  if (review.isDeleted) {
    throw new HttpException(404, 'Review not found');
  }

  // Check if user already reported this review
  const alreadyReported = review.reportedBy.some(
    (report) => report.userId.toString() === userId.toString()
  );

  if (alreadyReported) {
    throw new HttpException(409, 'You have already reported this review');
  }

  // Add report
  review.reportedBy.push({
    userId,
    reason,
    reportedAt: new Date(),
  });

  await review.save();

  // Auto-flag for moderation if 3+ reports
  if (review.reportedBy.length >= 3) {
    // Could trigger notification to admin here
    console.log(`Review ${reviewId} flagged for moderation (${review.reportedBy.length} reports)`);
  }

  return {
    message: 'Review reported successfully',
    reportCount: review.reportedBy.length,
  };
};

export default {
  canUserReview,
  createReview,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsForUser,
  getReviewsForJob,
  getUserRatingStats,
  reportReview,
};
