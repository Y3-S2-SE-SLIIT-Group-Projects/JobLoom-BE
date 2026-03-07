import express from 'express';
import { protect } from '../../middleware/auth/authMiddleware.js';
import { requireEmployer } from '../../middleware/role.middleware.js';
import {
  connectCalendly,
  statusCalendly,
  removeCalendly,
  saveCalendlyUrl,
  receiveWebhook,
} from './calendly.controller.js';

const router = express.Router();

router.post('/connect', protect, requireEmployer, connectCalendly);
router.get('/status', protect, requireEmployer, statusCalendly);
router.put('/url', protect, requireEmployer, saveCalendlyUrl);
router.delete('/disconnect', protect, requireEmployer, removeCalendly);

// Webhook endpoint — no JWT auth; verified via Calendly signature
router.post('/webhook', receiveWebhook);

export default router;
