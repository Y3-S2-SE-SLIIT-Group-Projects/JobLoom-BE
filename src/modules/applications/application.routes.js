import express from 'express';
import * as applicationController from './application.controller.js';
import * as applicationValidation from './application.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireJobSeeker, requireEmployer } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

const router = express.Router();

/**
 * Application Routes
 * All routes for Job Application management
 */

// ─── Public routes (no authentication required) ───

/**
 * Check application eligibility (used by Review module)
 */
router.get('/check/:jobId/:userId', applicationController.checkApplicationEligibility);

// ─── Protected routes (authentication required) ───

/**
 * Get my applications (job seeker)
 * Must be defined before /:id to avoid matching "my-applications" as an :id
 */
router.get(
  '/my-applications',
  authenticate,
  requireJobSeeker,
  applicationValidation.getMyApplicationsValidation,
  validate,
  applicationController.getMyApplications
);

/**
 * Get all applications for a job (employer)
 * Must be defined before /:id to avoid matching "job" as an :id
 */
router.get(
  '/job/:jobId',
  authenticate,
  requireEmployer,
  applicationValidation.getJobApplicationsValidation,
  validate,
  applicationController.getJobApplications
);

/**
 * Get application by ID
 */
router.get(
  '/:id',
  authenticate,
  applicationValidation.getApplicationValidation,
  validate,
  applicationController.getApplicationById
);

/**
 * Apply for a job
 */
router.post(
  '/',
  authenticate,
  requireJobSeeker,
  applicationValidation.applyForJobValidation,
  validate,
  applicationController.applyForJob
);

/**
 * Update application status (employer)
 */
router.patch(
  '/:id/status',
  authenticate,
  requireEmployer,
  applicationValidation.updateStatusValidation,
  validate,
  applicationController.updateApplicationStatus
);

/**
 * Withdraw an application (job seeker)
 */
router.patch(
  '/:id/withdraw',
  authenticate,
  requireJobSeeker,
  applicationValidation.withdrawApplicationValidation,
  validate,
  applicationController.withdrawApplication
);

export default router;
