/**
 * Custom HTTP Exception Class
 * Extended Error class for handling HTTP errors with status codes
 */
class HttpException extends Error {
  /**
   * Create a new HttpException
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {object} details - Additional error details/metadata
   */
  constructor(statusCode, message, details = null) {
    super(message);

    this.name = 'HttpException';
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert exception to JSON format
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      error: {
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

// Common HTTP Exception factories
export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request', details = null) {
    super(400, message, details);
    this.name = 'BadRequestException';
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized', details = null) {
    super(401, message, details);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden', details = null) {
    super(403, message, details);
    this.name = 'ForbiddenException';
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not Found', details = null) {
    super(404, message, details);
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict', details = null) {
    super(409, message, details);
    this.name = 'ConflictException';
  }
}

export class InternalServerException extends HttpException {
  constructor(message = 'Internal Server Error', details = null) {
    super(500, message, details);
    this.name = 'InternalServerException';
  }
}

export default HttpException;
