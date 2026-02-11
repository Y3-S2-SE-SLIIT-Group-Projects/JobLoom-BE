import express from 'express';
import Job from './job.model.js';
import { sendSuccess } from '../../utils/response.utils.js';
import HttpException from '../../models/http-exception.js';

const router = express.Router();

/**
 * Job Routes (Basic)
 * Minimal routes for review validation
 */

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  const job = await Job.findById(req.params.id).populate('employerId', 'firstName lastName email');

  if (!job) {
    throw new HttpException(404, 'Job not found');
  }

  sendSuccess(res, 'Job retrieved successfully', { job });
});

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs
 * @access  Public
 */
router.get('/', async (req, res) => {
  const jobs = await Job.find()
    .populate('employerId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(50);

  sendSuccess(res, 'Jobs retrieved successfully', { jobs, count: jobs.length });
});

export default router;
