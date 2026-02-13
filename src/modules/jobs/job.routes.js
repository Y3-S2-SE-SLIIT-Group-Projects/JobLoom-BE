import express from 'express';
import * as jobController from './job.controller.js';
import * as jobValidation from './job.validation.js';
// import { authenticate } from '../../middleware/auth.middleware.js'; // TODO: Uncomment when authentication is ready
import { validate } from '../../middleware/validation.middleware.js';

const router = express.Router();

/**
 * Job Routes
 * All routes for Job Management Component
 */

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * Get all jobs with filtering, searching, sorting, and pagination
 */
router.get('/', jobValidation.getJobsValidation, validate, jobController.getAllJobs);

/**
 * Get nearby jobs using geospatial query (Mapbox integration)
 */
router.get('/nearby', jobValidation.getNearbyJobsValidation, validate, jobController.getNearbyJobs);

/**
 * Get single job by ID
 */
router.get('/:id', jobValidation.getJobValidation, validate, jobController.getJobById);

// ============================================
// PROTECTED ROUTES (Employer only)
// ============================================

/**
 * Create a new job posting
 * TODO: Add authenticate middleware when authentication is implemented
 */
router.post(
  '/',
  // authenticate, // Uncomment when authentication is ready
  jobValidation.createJobValidation,
  validate,
  jobController.createJob
);

/**
 * Get jobs created by employer (My Jobs)
 * TODO: Add authenticate middleware when authentication is implemented
 */
router.get(
  '/employer/my-jobs',
  // authenticate, // Uncomment when authentication is ready
  jobValidation.getEmployerJobsValidation,
  validate,
  jobController.getEmployerJobs
);

/**
 * Get employer statistics for dashboard
 * TODO: Add authenticate middleware when authentication is implemented
 */
router.get(
  '/employer/stats',
  // authenticate, // Uncomment when authentication is ready
  jobController.getEmployerStats
);

/**
 * Update job details
 * TODO: Add authenticate middleware when authentication is implemented
 */
router.put(
  '/:id',
  // authenticate, // Uncomment when authentication is ready
  jobValidation.updateJobValidation,
  validate,
  jobController.updateJob
);

/**
 * Close a job posting
 * TODO: Add authenticate middleware when authentication is implemented
 */
router.patch(
  '/:id/close',
  // authenticate, // Uncomment when authentication is ready
  jobValidation.getJobValidation,
  validate,
  jobController.closeJob
);

/**
 * Mark job as filled
 * TODO: Add authenticate middleware when authentication is implemented
 */
router.patch(
  '/:id/filled',
  // authenticate, // Uncomment when authentication is ready
  jobValidation.getJobValidation,
  validate,
  jobController.markJobAsFilled
);

/**
 * Delete a job (soft delete)
 * TODO: Add authenticate middleware when authentication is implemented
 */
router.delete(
  '/:id',
  // authenticate, // Uncomment when authentication is ready
  jobValidation.deleteJobValidation,
  validate,
  jobController.deleteJob
);

export default router;
