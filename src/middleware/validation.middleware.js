import { validationResult } from 'express-validator';
import HttpException from '../models/http-exception.js';
import { HTTP_STATUS } from '../config/server.config.js';

/**
 * Validation Middleware
 * Processes express-validator results and returns errors
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    throw new HttpException(HTTP_STATUS.BAD_REQUEST, 'Validation failed', formattedErrors);
  }

  next();
};

export default validate;
