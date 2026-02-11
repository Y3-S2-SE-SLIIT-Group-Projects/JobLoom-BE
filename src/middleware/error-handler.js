import logger from '../config/logger.config.js';
import HttpException from '../models/http-exception.js';
import envConfig from '../config/env.config.js';
import { HTTP_STATUS } from '../config/server.config.js';

/**
 * Global Exception Filter / Error Handler Middleware
 * Catches all errors and returns standardized error responses
 */
export const errorHandler = (err, req, res, _next) => {
  // Default error values
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let errorDetails = null;

  // Handle custom HttpException
  if (err instanceof HttpException) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.details;

    logger.error('HttpException:', {
      requestId: req.requestId,
      statusCode,
      message,
      details: errorDetails,
      url: req.originalUrl || req.url,
      method: req.method,
    });
  }
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation Error';
    errorDetails = {
      errors: Object.values(err.errors).map((error) => ({
        field: error.path,
        message: error.message,
      })),
    };

    logger.error('Mongoose ValidationError:', {
      requestId: req.requestId,
      url: req.originalUrl || req.url,
      method: req.method,
      errors: errorDetails,
    });
  }
  // Handle Mongoose duplicate key error
  else if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Duplicate Entry';
    const field = Object.keys(err.keyPattern)[0];
    errorDetails = {
      field,
      message: `${field} already exists`,
    };

    logger.error('Mongoose Duplicate Key Error:', {
      requestId: req.requestId,
      url: req.originalUrl || req.url,
      method: req.method,
      field,
    });
  }
  // Handle Mongoose CastError (invalid ObjectId, etc.)
  else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid Data Format';
    errorDetails = {
      field: err.path,
      value: err.value,
      message: `Invalid ${err.kind} for ${err.path}`,
    };

    logger.error('Mongoose CastError:', {
      requestId: req.requestId,
      url: req.originalUrl || req.url,
      method: req.method,
      details: errorDetails,
    });
  }
  // Handle JWT errors
  else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Unauthorized - Invalid or missing token';

    logger.error('JWT Error:', {
      requestId: req.requestId,
      url: req.originalUrl || req.url,
      method: req.method,
      message: err.message,
    });
  }
  // Handle all other errors
  else {
    logger.error('Unhandled Error:', {
      requestId: req.requestId,
      url: req.originalUrl || req.url,
      method: req.method,
      message: err.message,
      stack: err.stack,
    });
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    message,
  };

  // Include error details in response
  if (errorDetails) {
    errorResponse.error = errorDetails;
  }

  // Include stack trace only in development mode
  if (envConfig.isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  // Add request ID to response
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 * Catches all undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new HttpException(
    HTTP_STATUS.NOT_FOUND,
    `Route not found: ${req.method} ${req.originalUrl || req.url}`
  );
  next(error);
};

export default errorHandler;
