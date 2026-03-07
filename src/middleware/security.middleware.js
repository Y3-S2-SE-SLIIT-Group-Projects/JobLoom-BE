import helmet from 'helmet';
import envConfig from '../config/env.config.js';

/**
 * Security Middleware Configuration
 * Configures Helmet with environment-appropriate settings
 */

/**
 * Get Helmet configuration based on environment
 */
const getHelmetConfig = () => {
  return {
    contentSecurityPolicy: envConfig.isProduction
      ? undefined // Use default CSP in production
      : {
          // Relaxed CSP for development
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
          },
        },
    crossOriginEmbedderPolicy: !envConfig.isDevelopment,
    crossOriginResourcePolicy: false,
  };
};

/**
 * Apply security middleware to Express app
 */
export const configureSecurityMiddleware = (app) => {
  // Apply Helmet with configuration
  app.use(helmet(getHelmetConfig()));

  // Disable X-Powered-By header to hide Express fingerprint
  app.disable('x-powered-by');
};

export default configureSecurityMiddleware;
