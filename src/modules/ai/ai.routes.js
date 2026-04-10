import express from 'express';
import { analyzeSkillGapController } from './ai.controller.js';
import { protect } from '../../middleware/auth/authMiddleware.js';
import { authorize } from '../../middleware/auth/roleMiddleware.js';

const router = express.Router();

router.post('/analyze-skill-gap', protect, authorize('job_seeker'), analyzeSkillGapController);

export default router;
