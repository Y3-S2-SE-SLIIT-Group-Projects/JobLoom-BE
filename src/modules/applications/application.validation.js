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

  body('resumeUrl')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Resume URL must be a valid HTTP or HTTPS URL'),

  body('cvId').optional().isMongoId().withMessage('Invalid CV ID'),
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

export const getInterviewJoinContextValidation = [
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

export const getApplicationStatsValidation = [
  param('jobId').isMongoId().withMessage('Invalid job ID'),
];

export const updateNotesValidation = [
  param('id').isMongoId().withMessage('Invalid application ID'),

  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const scheduleInterviewValidation = [
  param('id').isMongoId().withMessage('Invalid application ID'),

  body('interviewDate')
    .notEmpty()
    .withMessage('Interview date is required')
    .isISO8601()
    .withMessage('Interview date must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Interview date must be in the future');
      }
      return true;
    }),

  body('interviewType')
    .notEmpty()
    .withMessage('Interview type is required')
    .isIn(['virtual', 'in_person'])
    .withMessage('Interview type must be virtual or in_person'),

  body('interviewDuration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),

  body('interviewLocation')
    .if(body('interviewType').equals('in_person'))
    .trim()
    .notEmpty()
    .withMessage('Location is required for in-person interviews')
    .isLength({ max: 300 })
    .withMessage('Location cannot exceed 300 characters'),

  body('interviewLocationNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location notes cannot exceed 500 characters'),
];

export default {
  applyForJobValidation,
  withdrawApplicationValidation,
  updateStatusValidation,
  getApplicationValidation,
  getInterviewJoinContextValidation,
  getJobApplicationsValidation,
  getMyApplicationsValidation,
  getApplicationStatsValidation,
  updateNotesValidation,
  scheduleInterviewValidation,
};
