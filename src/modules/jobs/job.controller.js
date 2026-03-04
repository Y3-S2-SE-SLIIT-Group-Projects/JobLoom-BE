import * as jobService from './job.service.js';
import { sendSuccess, sendCreated, sendError } from '../../utils/response.utils.js';
import { generateCompletion } from '../../utils/llm.client.js';

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
 * @route   POST /api/jobs/generate-description
 * @desc    Generate a job description from draft fields
 * @access  Private (Employer only)
 */
export const generateJobDescription = async (req, res) => {
  try {
    const payload = req.body || {};

    const baseSystem = `You are an expert recruiter and senior copywriter who writes clear, persuasive, SEO-friendly, and role-specific job descriptions that give candidates a perfect idea of the job, impact, and expectations. Avoid vague phrases; prefer concrete outcomes and measurable impact.`;

    const userJson = JSON.stringify(
      {
        title: payload.title,
        seniority: payload.seniority,
        team: payload.team,
        location: payload.location,
        employment_type: payload.employment_type,
        about_company: payload.about_company,
        top_responsibilities: payload.top_responsibilities,
        must_have_requirements: payload.must_have_requirements,
        nice_to_have: payload.nice_to_have,
        salary_range: payload.salary_range,
        benefits: payload.benefits,
        tone: payload.tone || 'professional, detailed, persuasive',
        target_length_words: payload.target_length_words || 220,
      },
      null,
      2
    );

    const userMessage = `Job data:\n${userJson}\n\nProduce a single job description approximately ${payload.target_length_words || 220} words using this structure: one-line headline; 1-2 paragraph role summary (impact + team + top responsibilities); 'Key Responsibilities' bullets; 'Who You Are / Qualifications' bullets; 'Why Join Us' paragraph; 'How to Apply' line. Use concrete outcomes and include keywords.`;

    const prompt = `${baseSystem}\n\n${userMessage}`;

    const aiResponse = await generateCompletion(prompt, { max_tokens: 700, temperature: 0.2 });

    sendSuccess(res, 'Description generated', { description: aiResponse });
  } catch (err) {
    // If the error contains Cohere response data, include it for debugging (but don't leak secrets)
    const errorDetails = err?.response || err?.message || String(err);
    sendError(res, 'Failed to generate description', 500, errorDetails);
  }
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
  generateJobDescription,
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
