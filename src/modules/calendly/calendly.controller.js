import {
  exchangeCodeAndConnect,
  disconnectCalendly,
  getCalendlyStatus,
  saveManualSchedulingUrl,
} from './calendly.service.js';
import {
  verifyWebhookSignature,
  createWebhookSubscription,
  handleWebhookEvent,
} from './calendly.webhook.js';
import { sendSuccess, sendError } from '../../utils/response.utils.js';
import logger from '../../config/logger.config.js';

/**
 * POST /api/calendly/connect
 * Receives the OAuth authorization code from the frontend callback page
 * and exchanges it for tokens.
 */
export const connectCalendly = async (req, res) => {
  try {
    const { code, redirectUri, codeVerifier } = req.body;
    if (!code) {
      return sendError(res, 'Authorization code is required', 400);
    }
    if (!codeVerifier) {
      return sendError(
        res,
        'Session expired. Please try connecting Calendly again from the settings page.',
        400
      );
    }

    const user = await exchangeCodeAndConnect(req.user._id, code, redirectUri, codeVerifier);

    // Best-effort webhook subscription — don't block the connect response
    createWebhookSubscription(user).catch((err) => {
      logger.warn('Failed to create Calendly webhook subscription', {
        message: err.response?.data?.message || err.message,
      });
    });

    return sendSuccess(res, 'Calendly connected successfully', {
      schedulingUrl: user.calendly.schedulingUrl,
    });
  } catch (error) {
    const calendlyError = error.response?.data;
    const message =
      calendlyError?.message ||
      calendlyError?.error_description ||
      calendlyError?.error ||
      error.message;
    logger.error('Calendly connect failed', {
      userId: req.user._id,
      message,
      calendlyResponse: calendlyError,
      redirectUri: req.body?.redirectUri,
    });
    const status = error.response?.status || 500;
    const userMessage =
      status === 400 && (calendlyError?.message || calendlyError?.error_description)
        ? calendlyError.message || calendlyError.error_description
        : message?.includes('not configured')
          ? message
          : 'Failed to connect Calendly. Please try again.';
    return sendError(res, userMessage, status >= 400 && status < 500 ? 400 : 500);
  }
};

/**
 * GET /api/calendly/status
 * Returns whether the current employer has Calendly connected.
 * Includes accountEmail so the frontend can verify the correct user's data is shown.
 */
export const statusCalendly = async (req, res) => {
  try {
    const status = await getCalendlyStatus(req.user._id);
    return sendSuccess(res, 'Calendly status retrieved', {
      ...status,
      accountEmail: req.user.email, // Verify which JobLoom account this Calendly is linked to
    });
  } catch (error) {
    logger.error('Calendly status check failed', { message: error.message });
    return sendError(res, 'Failed to retrieve Calendly status', 500);
  }
};

/**
 * DELETE /api/calendly/disconnect
 * Removes stored Calendly tokens for the current employer.
 */
export const removeCalendly = async (req, res) => {
  try {
    await disconnectCalendly(req.user._id);
    return sendSuccess(res, 'Calendly disconnected successfully');
  } catch (error) {
    logger.error('Calendly disconnect failed', { message: error.message });
    return sendError(res, 'Failed to disconnect Calendly', 500);
  }
};

/**
 * PUT /api/calendly/url
 * Manually save a Calendly scheduling URL without OAuth.
 */
export const saveCalendlyUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return sendError(res, 'Calendly URL is required', 400);
    }

    const schedulingUrl = await saveManualSchedulingUrl(req.user._id, url);
    return sendSuccess(res, 'Calendly URL saved successfully', { schedulingUrl });
  } catch (error) {
    logger.error('Calendly URL save failed', { message: error.message });
    const isValidation = error.message.includes('Invalid Calendly URL');
    return sendError(res, error.message, isValidation ? 400 : 500);
  }
};

/**
 * POST /api/calendly/webhook
 * Receives Calendly webhook events (no JWT auth — verified via signature).
 */
export const receiveWebhook = async (req, res) => {
  try {
    const signature = req.headers['calendly-webhook-signature'];
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Calendly webhook signature verification failed');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { event, payload } = req.body;
    if (!event || !payload) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    logger.info('Calendly webhook received', { event, inviteeEmail: payload.email });

    // Process asynchronously — respond 200 quickly so Calendly doesn't retry
    res.status(200).json({ received: true });

    await handleWebhookEvent(event, payload);
  } catch (error) {
    logger.error('Calendly webhook processing error', { message: error.message });
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Webhook processing failed' });
    }
  }
};
