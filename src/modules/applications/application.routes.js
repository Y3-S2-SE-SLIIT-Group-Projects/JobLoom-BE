import express from 'express';
import Application from './application.model.js';
import { sendSuccess } from '../../utils/response.utils.js';
import HttpException from '../../models/http-exception.js';

const router = express.Router();

/**
 * Application Routes (Basic)
 * Minimal routes for review validation
 */

/**
 * @route   GET /api/applications/check/:jobId/:userId
 * @desc    Check if user has accepted application for job
 * @access  Public (used for review eligibility check)
 */
router.get('/check/:jobId/:userId', async (req, res) => {
  const { jobId, userId } = req.params;

  const application = await Application.findOne({
    jobId,
    $or: [{ jobSeekerId: userId }, { employerId: userId }],
    status: 'accepted',
  });

  sendSuccess(res, 'Application check completed', {
    hasAcceptedApplication: !!application,
    application: application || null,
  });
});

/**
 * @route   GET /api/applications/:id
 * @desc    Get application by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('jobId', 'title description')
    .populate('jobSeekerId', 'firstName lastName email')
    .populate('employerId', 'firstName lastName email');

  if (!application) {
    throw new HttpException(404, 'Application not found');
  }

  sendSuccess(res, 'Application retrieved successfully', { application });
});

export default router;
