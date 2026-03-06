import crypto from 'crypto';
import axios from 'axios';
import envConfig from '../../config/env.config.js';
import User from '../users/user.model.js';
import Application from '../applications/application.model.js';
import logger from '../../config/logger.config.js';

const CALENDLY_API_BASE = 'https://api.calendly.com';
const TOLERANCE_SECONDS = 180;

/**
 * Verify the Calendly-Webhook-Signature header against the raw body.
 * Returns true when the signature is valid.
 */
export const verifyWebhookSignature = (rawBody, signatureHeader) => {
  const signingKey = envConfig.calendlyWebhookSigningKey;
  if (!signingKey) return true; // skip verification when no key is configured

  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, ...v] = p.split('=');
      return [k.trim(), v.join('=')];
    })
  );

  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > TOLERANCE_SECONDS) return false;

  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', signingKey).update(payload, 'utf8').digest('hex');

  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
};

/**
 * Create a Calendly webhook subscription for a user (called after OAuth connect).
 */
export const createWebhookSubscription = async (user) => {
  const webhookUrl = envConfig.calendlyWebhookUrl;
  if (!webhookUrl) {
    logger.warn('CALENDLY_WEBHOOK_URL not configured — skipping webhook subscription');
    return null;
  }

  const { accessToken, calendlyUri } = user.calendly || {};
  if (!accessToken || !calendlyUri) return null;

  // Fetch the user's organization URI (required by the API)
  const meRes = await axios.get(`${CALENDLY_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const orgUri = meRes.data.resource.current_organization;

  const body = {
    url: webhookUrl,
    events: ['invitee.created', 'invitee.canceled'],
    organization: orgUri,
    user: calendlyUri,
    scope: 'user',
  };

  if (envConfig.calendlyWebhookSigningKey) {
    body.signing_key = envConfig.calendlyWebhookSigningKey;
  }

  const res = await axios.post(`${CALENDLY_API_BASE}/webhook_subscriptions`, body, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  logger.info('Calendly webhook subscription created', {
    uri: res.data.resource.uri,
    user: calendlyUri,
  });

  return res.data.resource;
};

/**
 * Handle an incoming Calendly webhook event.
 */
export const handleWebhookEvent = async (event, payload) => {
  switch (event) {
    case 'invitee.created':
      await handleInviteeCreated(payload);
      break;
    case 'invitee.canceled':
      await handleInviteeCanceled(payload);
      break;
    default:
      logger.info(`Unhandled Calendly webhook event: ${event}`);
  }
};

// ── Private helpers ────────────────────────────────────────────────────────────

/**
 * When a new invitee books via Calendly, update the matching Application's interviewDate.
 */
const handleInviteeCreated = async (payload) => {
  const inviteeEmail = payload.email;
  const scheduledEventUri = payload.event; // URI of the scheduled event

  if (!inviteeEmail || !scheduledEventUri) {
    logger.warn('invitee.created: missing email or event URI');
    return;
  }

  // Find the employer who owns this Calendly account
  const employer = await findEmployerByWebhookPayload(payload);
  if (!employer) {
    logger.warn('invitee.created: no matching employer found');
    return;
  }

  // Fetch scheduled event details to get start_time
  const eventRes = await axios.get(scheduledEventUri, {
    headers: { Authorization: `Bearer ${employer.calendly.accessToken}` },
  });
  const startTime = eventRes.data.resource.start_time;

  // Find an active, non-final application for this employer + invitee email
  const jobSeeker = await User.findOne({ email: inviteeEmail.toLowerCase() });
  if (!jobSeeker) {
    logger.info('invitee.created: invitee email does not match a JobLoom user', { inviteeEmail });
    return;
  }

  const application = await Application.findOne({
    employerId: employer._id,
    jobSeekerId: jobSeeker._id,
    isActive: true,
    status: { $nin: ['accepted', 'rejected', 'withdrawn'] },
  }).sort({ createdAt: -1 });

  if (!application) {
    logger.info('invitee.created: no eligible application found', {
      employerId: employer._id,
      jobSeekerId: jobSeeker._id,
    });
    return;
  }

  application.interviewDate = new Date(startTime);
  await application.save();

  logger.info('Interview date synced from Calendly', {
    applicationId: application._id,
    interviewDate: startTime,
  });
};

/**
 * When an invitee cancels their Calendly booking, clear the interviewDate.
 */
const handleInviteeCanceled = async (payload) => {
  const inviteeEmail = payload.email;
  if (!inviteeEmail) return;

  const employer = await findEmployerByWebhookPayload(payload);
  if (!employer) return;

  const jobSeeker = await User.findOne({ email: inviteeEmail.toLowerCase() });
  if (!jobSeeker) return;

  const application = await Application.findOne({
    employerId: employer._id,
    jobSeekerId: jobSeeker._id,
    isActive: true,
    interviewDate: { $ne: null },
  }).sort({ createdAt: -1 });

  if (!application) return;

  application.interviewDate = null;
  await application.save();

  logger.info('Interview date cleared (Calendly cancellation)', {
    applicationId: application._id,
  });
};

/**
 * Resolve the JobLoom employer from webhook payload by looking up calendlyUri
 * from the scheduled event's event_memberships or the webhook's created_by field.
 */
const findEmployerByWebhookPayload = async (payload) => {
  // payload.uri contains the invitee URI which includes the scheduled event URI
  // The webhook top-level created_by is the Calendly user who created the subscription
  // For user-scoped webhooks, we can find the employer by their calendlyUri

  // Try to match via the event's organizer — but the payload only gives us the
  // scheduled event URI, not the organizer directly. However, user-scoped webhooks
  // only fire for one user, so we match by looking at which employer has a webhook
  // whose calendlyUri is embedded in the event URI path, or more reliably:
  // search for the employer whose calendly.calendlyUri matches the subscription owner.

  // The simplest reliable approach: extract the event URI and find an employer
  // whose access token can fetch it (i.e., they own it).
  // But that's expensive. Instead, search by scheduled_event URI prefix:
  //   payload.uri = "https://api.calendly.com/scheduled_events/XXX/invitees/YYY"
  //   employer's calendlyUri = "https://api.calendly.com/users/ZZZ"

  // For user-scoped webhooks the most reliable approach is to look up by the
  // invitee URI's event owner. The scheduled event URI contains the event ID;
  // the user who owns it registered the webhook. We stored their calendlyUri.

  // Since each user-scoped webhook only fires for one employer's events,
  // we can find the employer whose calendly.accessToken is set and whose
  // calendlyUri's organization matches. The simplest: search all employers
  // who have a calendly.accessToken and try to match.

  // Practical approach: find the single employer with an active Calendly connection
  // who has an application with the invitee. This is efficient because the invitee
  // email narrows it down heavily.

  const jobSeeker = await User.findOne({ email: payload.email?.toLowerCase() });
  if (!jobSeeker) return null;

  const apps = await Application.find({
    jobSeekerId: jobSeeker._id,
    isActive: true,
  }).select('employerId');

  const employerIds = [...new Set(apps.map((a) => a.employerId.toString()))];
  if (!employerIds.length) return null;

  return User.findOne({
    _id: { $in: employerIds },
    'calendly.accessToken': { $ne: null },
  });
};
