import express from 'express';
import * as jobController from './job.controller.js';
import * as jobValidation from './job.validation.js';
import { protect } from '../../middleware/auth/authMiddleware.js';
import { authorize } from '../../middleware/auth/roleMiddleware.js';
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
 * Protected route - Employer only
 */
router.post(
  '/',
  protect,
  authorize('employer'),
  jobValidation.createJobValidation,
  validate,
  jobController.createJob
);

/**
 * Get jobs created by employer (My Jobs)
 * Protected route - Employer only
 */
router.get(
  '/employer/my-jobs',
  protect,
  authorize('employer'),
  jobValidation.getEmployerJobsValidation,
  validate,
  jobController.getEmployerJobs
);

/**
 * Get employer statistics for dashboard
 * Protected route - Employer only
 */
router.get('/employer/stats', protect, authorize('employer'), jobController.getEmployerStats);

/**
 * Update job details
 * Protected route - Employer only (own jobs)
 */
router.put(
  '/:id',
  protect,
  authorize('employer'),
  jobValidation.updateJobValidation,
  validate,
  jobController.updateJob
);

/**
 * Close a job posting
 * Protected route - Employer only (own jobs)
 */
router.patch(
  '/:id/close',
  protect,
  authorize('employer'),
  jobValidation.getJobValidation,
  validate,
  jobController.closeJob
);

/**
 * Mark job as filled
 * Protected route - Employer only (own jobs)
 */
router.patch(
  '/:id/filled',
  protect,
  authorize('employer'),
  jobValidation.getJobValidation,
  validate,
  jobController.markJobAsFilled
);

/**
 * Delete a job (soft delete)
 * Protected route - Employer only (own jobs)
 */
router.delete(
  '/:id',
  protect,
  authorize('employer'),
  jobValidation.deleteJobValidation,
  validate,
  jobController.deleteJob
);

export default router;
