import axios from 'axios';
import envConfig from '../../config/env.config.js';
import User from '../users/user.model.js';

const CALENDLY_TOKEN_URL = 'https://auth.calendly.com/oauth/token';
const CALENDLY_API_BASE = 'https://api.calendly.com';

/**
 * Exchange an authorization code for Calendly access + refresh tokens,
 * fetch the user's Calendly profile, and persist everything on the User document.
 * Uses PKCE (code_verifier) as required by Calendly.
 * @param {string} redirectUri - Must match exactly what was used in the authorization request.
 * @param {string} codeVerifier - PKCE code_verifier from the authorization request.
 */
/**
 * Build Authorization header for Calendly OAuth token requests.
 * Calendly requires HTTP Basic Auth for client credentials (fixes invalid_client errors).
 */
const getCalendlyAuthHeader = () => {
  const clientId = envConfig.calendlyClientId?.trim();
  const clientSecret = envConfig.calendlyClientSecret?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      'Calendly OAuth is not configured. Set CALENDLY_CLIENT_ID and CALENDLY_CLIENT_SECRET in your .env file.'
    );
  }
  const credentials = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');
  return `Basic ${credentials}`;
};

export const exchangeCodeAndConnect = async (userId, code, redirectUri, codeVerifier) => {
  const resolvedRedirectUri =
    redirectUri ||
    envConfig.calendlyRedirectUri ||
    `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/calendly/callback`;

  const formBody = [
    ['grant_type', 'authorization_code'],
    ['redirect_uri', resolvedRedirectUri],
    ['code', code],
    ...(codeVerifier ? [['code_verifier', codeVerifier]] : []),
  ]
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const tokenResponse = await axios.post(CALENDLY_TOKEN_URL, formBody, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: getCalendlyAuthHeader(),
    },
  });

  const { access_token, refresh_token, expires_in } = tokenResponse.data;
  const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

  const meResponse = await axios.get(`${CALENDLY_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const { uri: calendlyUri, scheduling_url: schedulingUrl } = meResponse.data.resource;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      calendly: {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt,
        calendlyUri,
        schedulingUrl,
      },
    },
    { returnDocument: 'after' }
  ).select('-password');

  return user;
};

/**
 * Refresh an expired Calendly access token using the stored refresh token.
 */
export const refreshAccessToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user?.calendly?.refreshToken) {
    throw new Error('No Calendly refresh token available');
  }

  const refreshFormBody = [
    ['grant_type', 'refresh_token'],
    ['refresh_token', user.calendly.refreshToken],
  ]
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const tokenResponse = await axios.post(CALENDLY_TOKEN_URL, refreshFormBody, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: getCalendlyAuthHeader(),
    },
  });

  const { access_token, refresh_token, expires_in } = tokenResponse.data;

  user.calendly.accessToken = access_token;
  user.calendly.refreshToken = refresh_token;
  user.calendly.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
  await user.save();

  return user;
};

/**
 * Remove Calendly credentials from the user document.
 */
export const disconnectCalendly = async (userId) => {
  return User.findByIdAndUpdate(
    userId,
    {
      calendly: {
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        calendlyUri: null,
        schedulingUrl: null,
      },
    },
    { returnDocument: 'after' }
  ).select('-password');
};

/**
 * Return the public Calendly connection status for a user.
 */
export const getCalendlyStatus = async (userId) => {
  const user = await User.findById(userId).select('calendly');
  const hasOAuth = !!user?.calendly?.accessToken;
  const hasUrl = !!user?.calendly?.schedulingUrl;

  if (!hasOAuth && !hasUrl) {
    return { connected: false };
  }

  return {
    connected: true,
    schedulingUrl: user.calendly.schedulingUrl,
    tokenExpiresAt: user.calendly.tokenExpiresAt || null,
  };
};

const CALENDLY_URL_REGEX = /^https:\/\/(www\.)?calendly\.com\/.+/i;

/**
 * Manually save a Calendly scheduling URL (no OAuth required).
 */
export const saveManualSchedulingUrl = async (userId, url) => {
  const trimmed = url.trim();
  if (!CALENDLY_URL_REGEX.test(trimmed)) {
    throw new Error('Invalid Calendly URL. Must start with https://calendly.com/');
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!user.calendly) user.calendly = {};
  user.calendly.schedulingUrl = trimmed;
  await user.save();

  return user.calendly.schedulingUrl;
};
