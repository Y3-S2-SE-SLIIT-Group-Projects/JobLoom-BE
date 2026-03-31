import { Router } from 'express';
import { getStats, getUsers, updateUser, getJobs, updateJob } from './admin.controller.js';
import { requireAdmin } from '../../middleware/role.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Dashboard Statistics - Only for Admin
router.get('/stats', authenticate, requireAdmin, getStats);

// User Management - Only for Admin
router.get('/users', authenticate, requireAdmin, getUsers);
router.put('/users/:userId', authenticate, requireAdmin, updateUser);

// Job Management - Only for Admin
router.get('/jobs', authenticate, requireAdmin, getJobs);
router.put('/jobs/:jobId', authenticate, requireAdmin, updateJob);

export default router;
