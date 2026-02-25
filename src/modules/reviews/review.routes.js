import express from 'express';
import * as reviewController from './review.controller.js';
import * as reviewValidation from './review.validation.js';
import { protect } from '../../middleware/auth/authMiddleware.js';
import { validate } from '../../middleware/validation.middleware.js';

const router = express.Router();

/**
 * Review Routes
 * All routes for Review & Rating Component
 * IMPORTANT: Specific routes BEFORE parametric routes to avoid conflicts
 */

// Public routes (no authentication required)

/**
 * Get all reviews for a user
 */
router.get(
  '/user/:userId',
  reviewValidation.getUserReviewsValidation,
  validate,
  reviewController.getReviewsForUser
);

/**
 * Get reviews for a specific job
 */
router.get(
  '/job/:jobId',
  reviewValidation.getJobReviewsValidation,
  validate,
  reviewController.getReviewsForJob
);

/**
 * Get rating statistics for a user
 */
router.get(
  '/stats/:userId',
  reviewValidation.getUserStatsValidation,
  validate,
  reviewController.getUserRatingStats
);

/**
 * Get reviews for an employer (alias)
 */
router.get(
  '/employer/:employerId',
  reviewValidation.getEmployerReviewsValidation,
  validate,
  reviewController.getEmployerReviews
);

/**
 * Get reviews for a job seeker (alias)
 */
router.get(
  '/jobseeker/:jobSeekerId',
  reviewValidation.getJobSeekerReviewsValidation,
  validate,
  reviewController.getJobSeekerReviews
);

/**
 * Get single review by ID
 * MUST be after specific routes to avoid catching them
 */
router.get('/:id', reviewValidation.getReviewValidation, validate, reviewController.getReviewById);

// Protected routes (authentication required)

/**
 * Create a new review
 */
router.post(
  '/',
  protect,
  reviewValidation.createReviewValidation,
  validate,
  reviewController.createReview
);

/**
 * Update own review
 */
router.put(
  '/:id',
  protect,
  reviewValidation.updateReviewValidation,
  validate,
  reviewController.updateReview
);

/**
 * Delete own review (soft delete)
 */
router.delete(
  '/:id',
  protect,
  reviewValidation.deleteReviewValidation,
  validate,
  reviewController.deleteReview
);

/**
 * Report a review
 */
router.post(
  '/:id/report',
  protect,
  reviewValidation.reportReviewValidation,
  validate,
  reviewController.reportReview
);

export default router;
