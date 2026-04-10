import { analyzeSkillGap } from './ai.service.js';
import { sendSuccess, sendError } from '../../utils/response.utils.js';

/**
 * @route   POST /api/ai/analyze-skill-gap
 * @desc    Analyze skill gap between a job and a user's CV
 * @access  Private (Job Seeker)
 */
export const analyzeSkillGapController = async (req, res) => {
  try {
    const { jobId, cvId, language } = req.body;

    if (!jobId || !cvId) {
      return sendError(res, 'jobId and cvId are required', 400);
    }

    const userId = req.user._id.toString();
    const result = await analyzeSkillGap(jobId, cvId, userId, language);

    sendSuccess(res, 'Skill gap analysis completed', result);
  } catch (err) {
    const status = err.status || 500;
    sendError(res, err.message || 'Failed to analyze skill gap', status);
  }
};
