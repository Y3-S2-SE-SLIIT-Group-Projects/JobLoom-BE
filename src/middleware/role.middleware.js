import HttpException from '../models/http-exception.js';
import { HTTP_STATUS } from '../config/server.config.js';

/**
 * Role-Based Access Control Middleware
 * Restricts access to routes based on user role
 */

/**
 * Require specific role(s) to access route
 * @param {...string} allowedRoles - Roles that can access this route
 * @returns {Function} Middleware function
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new HttpException(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        throw new HttpException(
          HTTP_STATUS.FORBIDDEN,
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Require employer role
 */
export const requireEmployer = requireRole('employer');

/**
 * Require job seeker role
 */
export const requireJobSeeker = requireRole('job_seeker');

/**
 * Require either employer or job seeker (any authenticated user except admin)
 */
export const requireUser = requireRole('employer', 'job_seeker');

export default requireRole;
