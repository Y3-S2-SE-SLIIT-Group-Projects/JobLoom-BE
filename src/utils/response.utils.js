/**
 * Response Utilities
 * Standardized response format helpers
 */

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {object} errorDetails - Additional error details
 */
export const sendError = (res, message, statusCode = 500, errorDetails = null) => {
  const response = {
    success: false,
    message,
  };

  if (errorDetails !== null) {
    response.error = errorDetails;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {array} items - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 */
export const sendPaginatedResponse = (res, message, items, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    },
  });
};

/**
 * Send created response (201)
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {object} data - Created resource data
 */
export const sendCreated = (res, message, data) => {
  return sendSuccess(res, message, data, 201);
};

/**
 * Send no content response (204)
 * @param {object} res - Express response object
 */
export const sendNoContent = (res) => {
  return res.status(204).send();
};

export default {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  sendCreated,
  sendNoContent,
};
