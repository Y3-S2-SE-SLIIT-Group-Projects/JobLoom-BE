import * as jobService from './job.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.utils.js';

/**
 * Job Controller
 * HTTP request handlers for job endpoints
 */

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 * @access  Private (Employer only)
 */
export const createJob = async (req, res) => {
  // Get employer ID from authenticated user
  const employerId = req.user._id.toString();

  const job = await jobService.createJob(req.body, employerId);

  sendCreated(res, 'Job created successfully', job);
};

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering, searching, sorting, and pagination
 * @access  Public
 */
export const getAllJobs = async (req, res) => {
  const result = await jobService.getAllJobs(req.query);

  sendSuccess(res, 'Jobs retrieved successfully', result);
};

/**
 * @route   GET /api/jobs/nearby
 * @desc    Get nearby jobs using geospatial query
 * @access  Public
 */
export const getNearbyJobs = async (req, res) => {
  const { lat, lng, radius = 50 } = req.query;

  const jobs = await jobService.getNearbyJobs(Number(lng), Number(lat), Number(radius));

  sendSuccess(res, `Found ${jobs.length} jobs within ${radius}km`, { jobs });
};

/**
 * @route   GET /api/jobs/recommendations
 * @desc    Get recommended jobs for the current user
 * @access  Private
 */
export const getRecommendedJobs = async (req, res) => {
  const jobs = await jobService.getRecommendedJobs(req.user);

  sendSuccess(res, `Found ${jobs.length} recommendations for you`, { jobs });
};

/**
 * @route   GET /api/jobs/employer/my-jobs
 * @desc    Get jobs created by employer
 * @access  Private (Employer only)
 */
export const getEmployerJobs = async (req, res) => {
  // Get employer ID from authenticated user
  const employerId = req.user._id.toString();

  const { includeInactive, status } = req.query;

  const jobs = await jobService.getJobsByEmployer(employerId, {
    includeInactive: includeInactive === 'true',
    status,
  });

  sendSuccess(res, 'Jobs retrieved successfully', { jobs });
};

/**
 * @route   GET /api/jobs/employer/stats
 * @desc    Get employer statistics for dashboard
 * @access  Private (Employer only)
 */
export const getEmployerStats = async (req, res) => {
  // Get employer ID from authenticated user
  const employerId = req.user._id.toString();

  const stats = await jobService.getEmployerStats(employerId);

  sendSuccess(res, 'Statistics retrieved successfully', stats);
};

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single job by ID
 * @access  Public
 */
export const getJobById = async (req, res) => {
  const job = await jobService.getJobById(req.params.id);

  sendSuccess(res, 'Job retrieved successfully', job);
};

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job details
 * @access  Private (Employer only - own jobs)
 */
export const updateJob = async (req, res) => {
  // Get employer ID from authenticated user
  const employerId = req.user._id.toString();

  const job = await jobService.updateJob(req.params.id, employerId, req.body);

  sendSuccess(res, 'Job updated successfully', job);
};

/**
 * @route   PATCH /api/jobs/:id/close
 * @desc    Close a job posting
 * @access  Private (Employer only - own jobs)
 */
export const closeJob = async (req, res) => {
  // Get employer ID from authenticated user
  const employerId = req.user._id.toString();

  const job = await jobService.closeJob(req.params.id, employerId);

  sendSuccess(res, 'Job closed successfully', job);
};

/**
 * @route   PATCH /api/jobs/:id/filled
 * @desc    Mark job as filled
 * @access  Private (Employer only - own jobs)
 */
export const markJobAsFilled = async (req, res) => {
  // Get employer ID from authenticated user
  const employerId = req.user._id.toString();

  const job = await jobService.markJobAsFilled(req.params.id, employerId);

  sendSuccess(res, 'Job marked as filled', job);
};

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job (soft delete)
 * @access  Private (Employer only - own jobs)
 */
export const deleteJob = async (req, res) => {
  // Get employer ID from authenticated user
  const employerId = req.user._id.toString();

  await jobService.deleteJob(req.params.id, employerId);

  sendSuccess(res, 'Job deleted successfully', {
    message: 'Job has been deactivated',
  });
};

export default {
  createJob,
  getAllJobs,
  getNearbyJobs,
  getEmployerJobs,
  getEmployerStats,
  getJobById,
  updateJob,
  getRecommendedJobs,
  closeJob,
  markJobAsFilled,
  deleteJob,
};
