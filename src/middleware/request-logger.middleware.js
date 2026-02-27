import morgan from 'morgan';
import envConfig from '../config/env.config.js';
import logger from '../config/logger.config.js';
import { SERVER_CONFIG } from '../config/server.config.js';

/**
 * Request Logger Middleware Configuration
 * Configures Morgan HTTP request logger with Winston integration
 */

/**
 * Determine if a request should be logged
 */
const shouldSkipLogging = (req) => {
  // Skip logging in test environment
  if (envConfig.isTest) return true;

  // Skip health check endpoints if configured
  if (SERVER_CONFIG.SKIP_HEALTH_CHECK_LOGS) {
    const healthEndpoints = ['/health', '/healthz', '/ready'];
    return healthEndpoints.includes(req.url);
  }

  return false;
};

/**
 * Get Morgan format based on environment
 */
const getMorganFormat = () => {
  // Use concise format in development, detailed format in production
  return envConfig.isDevelopment ? 'dev' : 'combined';
};

/**
 * Apply request logger middleware to Express app
 */
export const configureRequestLogger = (app) => {
  if (!SERVER_CONFIG.ENABLE_REQUEST_LOGGING) {
    return;
  }

  app.use(
    morgan(getMorganFormat(), {
      stream: logger.stream,
      skip: shouldSkipLogging,
    })
  );
};

export default configureRequestLogger;
