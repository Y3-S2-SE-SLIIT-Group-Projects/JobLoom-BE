import { Router } from 'express';
import jobService from './job.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.utils.js';
import { BadRequestException } from '../../models/http-exception.js';
import {
  validateCreateJob,
  validateUpdateJob,
  validateJobQuery,
  validateNearbyQuery,
} from './job.validation.js';

const router = Router();

// ============================================
// TEMPORARY: Static employer ID until user management is complete
// Replace this with actual authentication middleware
// ============================================
const TEMP_EMPLOYER_ID = '507f1f77bcf86cd799439011'; // Example MongoDB ObjectId

/**
 * Middleware to extract employer ID
 * TODO: Replace with actual authentication middleware
 */
const getEmployerId = (req, res, next) => {
  // For now, use static employer ID
  // In future, this will come from JWT token: req.user.id
  req.employerId = TEMP_EMPLOYER_ID;
  next();
};

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Create a new job posting
 * @route POST /api/jobs
 * @access Private (Employer only)
 * @returns {object} Created job
 */
router.post('/', getEmployerId, async (req, res, next) => {
  try {
    // Validate request body
    const validation = validateCreateJob(req.body);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    const job = await jobService.createJob(req.body, req.employerId);

    sendCreated(res, 'Job created successfully', job);
  } catch (error) {
    next(error);
  }
});

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all jobs with filtering, searching, sorting, and pagination
 * @route GET /api/jobs
 * @access Public
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} category - Filter by category
 * @query {string} status - Filter by status (open, closed, filled)
 * @query {string} search - Search in title and description
 * @query {number} minSalary - Minimum salary
 * @query {number} maxSalary - Maximum salary
 * @query {string} salaryType - Salary type filter
 * @query {string} district - Filter by district
 * @query {string} province - Filter by province
 * @query {string} sortBy - Sort by field (default: createdAt)
 * @query {string} sortOrder - Sort order: asc or desc (default: desc)
 * @returns {object} Jobs list with pagination metadata
 */
router.get('/', async (req, res, next) => {
  try {
    // Validate query parameters
    const validation = validateJobQuery(req.query);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    const result = await jobService.getAllJobs(req.query);

    sendSuccess(res, 'Jobs retrieved successfully', result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get nearby jobs using geospatial query (Mapbox integration)
 * @route GET /api/jobs/nearby
 * @access Public
 * @query {number} lat - Latitude
 * @query {number} lng - Longitude
 * @query {number} radius - Search radius in km (default: 50, max: 1000)
 * @returns {object} Nearby jobs
 */
router.get('/nearby', async (req, res, next) => {
  try {
    // Validate query parameters
    const validation = validateNearbyQuery(req.query);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    const { lat, lng, radius = 50 } = req.query;

    const jobs = await jobService.getNearbyJobs(Number(lng), Number(lat), Number(radius));

    sendSuccess(res, `Found ${jobs.length} jobs within ${radius}km`, { jobs });
  } catch (error) {
    next(error);
  }
});

/**
 * Get jobs created by employer (My Jobs)
 * @route GET /api/jobs/employer/my-jobs
 * @access Private (Employer only)
 * @query {boolean} includeInactive - Include inactive jobs (default: false)
 * @query {string} status - Filter by status
 * @returns {object} Employer's jobs
 */
router.get('/employer/my-jobs', getEmployerId, async (req, res, next) => {
  try {
    const { includeInactive, status } = req.query;

    const jobs = await jobService.getJobsByEmployer(req.employerId, {
      includeInactive: includeInactive === 'true',
      status,
    });

    sendSuccess(res, 'Jobs retrieved successfully', { jobs });
  } catch (error) {
    next(error);
  }
});

/**
 * Get employer statistics for dashboard
 * @route GET /api/jobs/employer/stats
 * @access Private (Employer only)
 * @returns {object} Statistics
 */
router.get('/employer/stats', getEmployerId, async (req, res, next) => {
  try {
    const stats = await jobService.getEmployerStats(req.employerId);

    sendSuccess(res, 'Statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
});

/**
 * Get single job by ID
 * @route GET /api/jobs/:id
 * @access Public
 * @param {string} id - Job ID
 * @returns {object} Job details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestException('Job ID is required');
    }

    const job = await jobService.getJobById(id);

    sendSuccess(res, 'Job retrieved successfully', job);
  } catch (error) {
    next(error);
  }
});

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update job details
 * @route PUT /api/jobs/:id
 * @access Private (Employer only - own jobs)
 * @param {string} id - Job ID
 * @returns {object} Updated job
 */
router.put('/:id', getEmployerId, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestException('Job ID is required');
    }

    // Validate update data
    const validation = validateUpdateJob(req.body);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    const job = await jobService.updateJob(id, req.employerId, req.body);

    sendSuccess(res, 'Job updated successfully', job);
  } catch (error) {
    next(error);
  }
});

/**
 * Close a job posting
 * @route PATCH /api/jobs/:id/close
 * @access Private (Employer only - own jobs)
 * @param {string} id - Job ID
 * @returns {object} Updated job
 */
router.patch('/:id/close', getEmployerId, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestException('Job ID is required');
    }

    const job = await jobService.closeJob(id, req.employerId);

    sendSuccess(res, 'Job closed successfully', job);
  } catch (error) {
    next(error);
  }
});

/**
 * Mark job as filled
 * @route PATCH /api/jobs/:id/filled
 * @access Private (Employer only - own jobs)
 * @param {string} id - Job ID
 * @returns {object} Updated job
 */
router.patch('/:id/filled', getEmployerId, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestException('Job ID is required');
    }

    const job = await jobService.markJobAsFilled(id, req.employerId);

    sendSuccess(res, 'Job marked as filled', job);
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a job (soft delete)
 * @route DELETE /api/jobs/:id
 * @access Private (Employer only - own jobs)
 * @param {string} id - Job ID
 * @returns {object} Success message
 */
router.delete('/:id', getEmployerId, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestException('Job ID is required');
    }

    await jobService.deleteJob(id, req.employerId);

    sendSuccess(res, 'Job deleted successfully', {
      message: 'Job has been deactivated',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
