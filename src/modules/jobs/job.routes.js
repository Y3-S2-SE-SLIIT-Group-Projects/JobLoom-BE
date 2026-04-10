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

router.get('/', jobValidation.getJobsValidation, validate, jobController.getAllJobs);

router.get('/nearby', jobValidation.getNearbyJobsValidation, validate, jobController.getNearbyJobs);

router.get('/recommendations', protect, jobController.getRecommendedJobs);

// ============================================
// PROTECTED ROUTES (Employer only)
// Static segments must be registered before /:id to avoid being swallowed by the param.
// ============================================

router.get(
  '/employer/my-jobs',
  protect,
  authorize('employer'),
  jobValidation.getEmployerJobsValidation,
  validate,
  jobController.getEmployerJobs
);

router.get('/employer/stats', protect, authorize('employer'), jobController.getEmployerStats);

router.post(
  '/generate-description',
  protect,
  authorize('employer'),
  jobValidation.generateJobDescriptionValidation,
  validate,
  jobController.generateJobDescription
);

router.post(
  '/',
  protect,
  authorize('employer'),
  jobValidation.createJobValidation,
  validate,
  jobController.createJob
);

// Param route must come after all static segments
router.get('/:id', jobValidation.getJobValidation, validate, jobController.getJobById);

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
