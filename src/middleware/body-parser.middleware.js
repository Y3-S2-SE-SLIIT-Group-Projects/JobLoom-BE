import express from 'express';
import logger from '../config/logger.config.js';
import { SERVER_CONFIG, HTTP_STATUS } from '../config/server.config.js';

/**
 * Body Parser Middleware Configuration
 * Configures JSON and URL-encoded body parsing with error handling
 */

/**
 * Apply body parser middleware to Express app
 */
export const configureBodyParser = (app) => {
  // Parse JSON bodies (preserve raw body for webhook signature verification)
  app.use(
    express.json({
      limit: SERVER_CONFIG.REQUEST_SIZE_LIMIT,
      strict: true,
    })
  );

  // Parse URL-encoded bodies
  app.use(
    express.urlencoded({
      extended: true,
      limit: SERVER_CONFIG.REQUEST_SIZE_LIMIT,
      parameterLimit: SERVER_CONFIG.PARAMETER_LIMIT,
    })
  );

  // Handle JSON parsing errors
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === HTTP_STATUS.BAD_REQUEST && 'body' in err) {
      logger.warn('Invalid JSON received', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        error: err.message,
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid JSON format',
        message: 'The request body contains malformed JSON',
      });
    }
    next(err);
  });
};

export default configureBodyParser;
