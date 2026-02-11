import { body, param } from 'express-validator';

/**
 * Validation schemas for user endpoints
 */

export const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('role')
    .optional()
    .isIn(['job_seeker', 'employer', 'admin'])
    .withMessage('Invalid role. Must be job_seeker, employer, or admin'),

  body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('password').trim().notEmpty().withMessage('Password is required'),
];

export const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),

  body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),

  body('skills').optional().isArray().withMessage('Skills must be an array'),

  body('experience').optional().trim(),

  body('location.village').optional().trim(),

  body('location.district').optional().trim(),

  body('location.province').optional().trim(),
];

export const getUserValidation = [param('id').isMongoId().withMessage('Invalid user ID')];

export default {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  getUserValidation,
};
