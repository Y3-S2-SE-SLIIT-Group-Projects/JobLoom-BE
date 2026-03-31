import * as reviewService from './review.service.js';
import { sendSuccess } from '../../utils/response.utils.js';
import asyncHandler from '../../middleware/async-handler.js';

/**
 * Review Controller
 * HTTP request handlers for review endpoints
 * All handlers wrapped with asyncHandler for proper error handling
 */

/**
 * @route   POST /api/reviews
 * @desc    Submit a review for completed job
 * @access  Private (Job Seeker or Employer)
 */
export const createReview = asyncHandler(async (req, res) => {
  // Derive reviewerType from the authenticated user's role so it cannot be forged
  const reviewerType = req.user.role === 'employer' ? 'employer' : 'job_seeker';

  // Map any uploaded images to their public URL paths
  const images = req.files?.length ? req.files.map((f) => `/uploads/reviews/${f.filename}`) : [];

  const reviewData = {
    ...req.body,
    reviewerId: req.user._id,
    reviewerType,
    images,
  };

  const review = await reviewService.createReview(reviewData);

  sendSuccess(res, 'Review submitted successfully', { review }, 201);
});

/**
 * @route   GET /api/reviews/:id
 * @desc    Get single review by ID
 * @access  Public
 */
export const getReviewById = asyncHandler(async (req, res) => {
  const review = await reviewService.getReviewById(req.params.id);

  sendSuccess(res, 'Review retrieved successfully', { review });
});

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update own review
 * @access  Private
 */
export const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.params.id, req.user._id, req.body);

  sendSuccess(res, 'Review updated successfully', { review });
});

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete own review
 * @access  Private
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const result = await reviewService.deleteReview(req.params.id, req.user._id, isAdmin);

  sendSuccess(res, result.message, null, 200);
});

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get all reviews for a user
 * @access  Public
 */
export const getReviewsForUser = asyncHandler(async (req, res) => {
  const filters = {
    reviewerType: req.query.reviewerType,
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort,
  };

  const result = await reviewService.getReviewsForUser(req.params.userId, filters);

  sendSuccess(res, 'Reviews retrieved successfully', result);
});

/**
 * @route   GET /api/reviews/job/:jobId
 * @desc    Get reviews related to a job
 * @access  Public
 */
export const getReviewsForJob = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getReviewsForJob(req.params.jobId);

  sendSuccess(res, 'Job reviews retrieved successfully', { reviews, count: reviews.length });
});

/**
 * @route   GET /api/reviews/stats/:userId
 * @desc    Get rating statistics for a user
 * @access  Public
 */
export const getUserRatingStats = asyncHandler(async (req, res) => {
  const stats = await reviewService.getUserRatingStats(req.params.userId);

  sendSuccess(res, 'Rating statistics retrieved successfully', { stats });
});

/**
 * @route   POST /api/reviews/:id/report
 * @desc    Report an inappropriate review
 * @access  Private
 */
export const reportReview = asyncHandler(async (req, res) => {
  const reportData = {
    userId: req.user._id,
    reason: req.body.reason,
  };

  const result = await reviewService.reportReview(req.params.id, reportData);

  sendSuccess(res, result.message, { reportCount: result.reportCount });
});

/**
 * @route   GET /api/reviews/employer/:employerId
 * @desc    Get reviews for an employer (alias)
 * @access  Public
 */
export const getEmployerReviews = asyncHandler(async (req, res) => {
  const filters = {
    reviewerType: 'job_seeker', // Reviews given by job seekers about employer
    page: req.query.page,
    limit: req.query.limit,
  };

  const result = await reviewService.getReviewsForUser(req.params.employerId, filters);

  sendSuccess(res, 'Employer reviews retrieved successfully', result);
});

/**
 * @route   GET /api/reviews/jobseeker/:jobSeekerId
 * @desc    Get reviews for a job seeker (alias)
 * @access  Public
 */
export const getJobSeekerReviews = asyncHandler(async (req, res) => {
  const filters = {
    reviewerType: 'employer', // Reviews given by employers about job seeker
    page: req.query.page,
    limit: req.query.limit,
  };

  const result = await reviewService.getReviewsForUser(req.params.jobSeekerId, filters);

  sendSuccess(res, 'Job seeker reviews retrieved successfully', result);
});

/**
 * @route   GET /api/reviews/sent/:userId
 * @desc    Get reviews SENT BY a user (reviews they wrote)
 * @access  Public
 */
export const getSentReviews = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort,
  };

  const result = await reviewService.getSentReviewsForUser(req.params.userId, filters);

  sendSuccess(res, 'Sent reviews retrieved successfully', result);
});

export default {
  createReview,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsForUser,
  getSentReviews,
  getReviewsForJob,
  getUserRatingStats,
  reportReview,
  getEmployerReviews,
  getJobSeekerReviews,
};
