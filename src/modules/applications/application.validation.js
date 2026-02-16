import { body, param, query } from 'express-validator';

/**
 * Validation schemas for application endpoints
 */

export const applyForJobValidation = [
  body('jobId')
    .notEmpty()
    .withMessage('Job ID is required')
    .isMongoId()
    .withMessage('Invalid job ID'),

  body('coverLetter')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Cover letter cannot exceed 1000 characters'),

  body('resumeUrl').optional().trim().isString().withMessage('Resume URL must be a string'),
];

export const withdrawApplicationValidation = [
  param('id').isMongoId().withMessage('Invalid application ID'),

  body('withdrawalReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Withdrawal reason cannot exceed 500 characters'),
];

export const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid application ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['reviewed', 'shortlisted', 'accepted', 'rejected'])
    .withMessage('Status must be one of: reviewed, shortlisted, accepted, rejected'),

  body('employerNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Employer notes cannot exceed 500 characters'),
];

export const getApplicationValidation = [
  param('id').isMongoId().withMessage('Invalid application ID'),
];

export const getJobApplicationsValidation = [
  param('jobId').isMongoId().withMessage('Invalid job ID'),

  query('status')
    .optional()
    .isIn(['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'])
    .withMessage('Status must be a valid application status'),

  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const getMyApplicationsValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'])
    .withMessage('Status must be a valid application status'),

  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export default {
  applyForJobValidation,
  withdrawApplicationValidation,
  updateStatusValidation,
  getApplicationValidation,
  getJobApplicationsValidation,
  getMyApplicationsValidation,
};
