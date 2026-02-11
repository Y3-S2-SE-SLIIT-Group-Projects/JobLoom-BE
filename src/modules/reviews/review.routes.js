import express from 'express';
import * as reviewController from './review.controller.js';
import * as reviewValidation from './review.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

const router = express.Router();

/**
 * Review Routes
 * All routes for Review & Rating Component
 */

// Public routes (no authentication required)

/**
 * Get single review by ID
 */
router.get('/:id', reviewValidation.getReviewValidation, validate, reviewController.getReviewById);

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
  reviewValidation.getUserReviewsValidation,
  validate,
  reviewController.getEmployerReviews
);

/**
 * Get reviews for a job seeker (alias)
 */
router.get(
  '/jobseeker/:jobSeekerId',
  reviewValidation.getUserReviewsValidation,
  validate,
  reviewController.getJobSeekerReviews
);

// Protected routes (authentication required)

/**
 * Create a new review
 */
router.post(
  '/',
  authenticate,
  reviewValidation.createReviewValidation,
  validate,
  reviewController.createReview
);

/**
 * Update own review
 */
router.put(
  '/:id',
  authenticate,
  reviewValidation.updateReviewValidation,
  validate,
  reviewController.updateReview
);

/**
 * Delete own review (soft delete)
 */
router.delete(
  '/:id',
  authenticate,
  reviewValidation.deleteReviewValidation,
  validate,
  reviewController.deleteReview
);

/**
 * Report a review
 */
router.post(
  '/:id/report',
  authenticate,
  reviewValidation.reportReviewValidation,
  validate,
  reviewController.reportReview
);

export default router;
