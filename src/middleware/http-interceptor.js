import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.config.js';

/**
 * HTTP Interceptor Middleware
 * Logs all incoming requests and outgoing responses
 * Adds request ID for tracing
 */
export const httpInterceptor = (req, res, next) => {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Add request ID to response headers
  res.setHeader('X-Request-Id', requestId);

  // Capture request start time
  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming Request', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Intercept response finish
  const originalSend = res.send;
  res.send = function (data) {
    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Log outgoing response
    logger.info('Outgoing Response', {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });

    // Call original send method
    originalSend.call(this, data);
  };

  next();
};

export default httpInterceptor;
