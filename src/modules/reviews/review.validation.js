import { body, param, query } from 'express-validator';

/**
 * Validation schemas for review endpoints
 */

export const createReviewValidation = [
  body('revieweeId')
    .notEmpty()
    .withMessage('Reviewee ID is required')
    .isMongoId()
    .withMessage('Invalid reviewee ID'),

  body('jobId')
    .notEmpty()
    .withMessage('Job ID is required')
    .isMongoId()
    .withMessage('Invalid job ID'),

  body('reviewerType')
    .notEmpty()
    .withMessage('Reviewer type is required')
    .isIn(['job_seeker', 'employer'])
    .withMessage('Reviewer type must be either job_seeker or employer'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),

  body('workQuality')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Work quality rating must be between 1 and 5'),

  body('communication')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),

  body('punctuality')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Punctuality rating must be between 1 and 5'),

  body('paymentOnTime')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Payment on time rating must be between 1 and 5'),

  body('wouldRecommend').optional().isBoolean().withMessage('Would recommend must be a boolean'),
];

export const updateReviewValidation = [
  param('id').isMongoId().withMessage('Invalid review ID'),

  body('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),

  body('workQuality')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Work quality rating must be between 1 and 5'),

  body('communication')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),

  body('punctuality')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Punctuality rating must be between 1 and 5'),

  body('paymentOnTime')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Payment on time rating must be between 1 and 5'),

  body('wouldRecommend').optional().isBoolean().withMessage('Would recommend must be a boolean'),
];

export const getReviewValidation = [param('id').isMongoId().withMessage('Invalid review ID')];

export const deleteReviewValidation = [param('id').isMongoId().withMessage('Invalid review ID')];

export const getUserReviewsValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID'),

  query('reviewerType')
    .optional()
    .isIn(['job_seeker', 'employer'])
    .withMessage('Reviewer type must be either job_seeker or employer'),

  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const getJobReviewsValidation = [param('jobId').isMongoId().withMessage('Invalid job ID')];

export const getUserStatsValidation = [param('userId').isMongoId().withMessage('Invalid user ID')];

export const reportReviewValidation = [
  param('id').isMongoId().withMessage('Invalid review ID'),

  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
];

export default {
  createReviewValidation,
  updateReviewValidation,
  getReviewValidation,
  deleteReviewValidation,
  getUserReviewsValidation,
  getJobReviewsValidation,
  getUserStatsValidation,
  reportReviewValidation,
};
