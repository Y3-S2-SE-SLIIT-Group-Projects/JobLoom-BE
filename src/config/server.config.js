/**
 * Server Configuration
 * Centralized server settings and constants
 */

export const SERVER_CONFIG = {
  // Request configuration
  REQUEST_SIZE_LIMIT: '10mb',
  PARAMETER_LIMIT: 10000,

  // Timeout configuration (in milliseconds)
  REQUEST_TIMEOUT: 30000, // 30 seconds
  KEEP_ALIVE_TIMEOUT: 65000, // 65 seconds (should be > load balancer timeout)
  HEADERS_TIMEOUT: 66000, // Should be > keepAliveTimeout
  SHUTDOWN_TIMEOUT: 10000, // 10 seconds

  // Server binding
  DEFAULT_HOST: '0.0.0.0',
  DEFAULT_PORT: 3000,

  // Feature flags
  SKIP_HEALTH_CHECK_LOGS: true,
  ENABLE_REQUEST_LOGGING: true,
};

/**
 * HTTP Status Codes
 * Centralized status code constants
 */
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Health Check Configuration
 */
export const HEALTH_CONFIG = {
  MEMORY_UNIT: 'MB',
  MEMORY_DIVISOR: 1024 * 1024,
  DEFAULT_VERSION: '1.0.0',
  DATABASE_TYPE: 'MongoDB',
};

/**
 * Get host for server binding
 */
export const getServerHost = () => {
  return process.env.HOST || SERVER_CONFIG.DEFAULT_HOST;
};

/**
 * Get server display URL for logging
 * Uses localhost for display purposes even when binding to 0.0.0.0
 */
export const getServerUrl = (port) => {
  const host = getServerHost();
  // For display purposes, use localhost if binding to all interfaces
  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  return `http://${displayHost}:${port}`;
};

/**
 * Get allowed CORS origins
 */
export const getAllowedOrigins = () => {
  const originsEnv = process.env.ALLOWED_ORIGINS;
  if (!originsEnv) return '*';

  return originsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};
