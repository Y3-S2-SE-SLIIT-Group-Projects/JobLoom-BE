import cors from 'cors';
import envConfig from '../config/env.config.js';
import { getAllowedOrigins } from '../config/server.config.js';

/**
 * CORS Middleware Configuration
 * Configures Cross-Origin Resource Sharing with environment-appropriate settings
 */

/**
 * Get CORS options based on environment
 */
const getCorsOptions = () => {
  const origin = envConfig.isDevelopment ? '*' : getAllowedOrigins();

  return {
    origin,
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
};

/**
 * Apply CORS middleware to Express app
 */
export const configureCorsMiddleware = (app) => {
  app.use(cors(getCorsOptions()));
};

export default configureCorsMiddleware;
