/**
 * Standardized API response helpers.
 */

/**
 * Send a success response
 */
function success(res, data, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a created response (201)
 */
function created(res, data, message = "Created successfully") {
  return success(res, data, message, 201);
}

/**
 * Send a paginated response
 */
function paginated(res, data, total, page, pageSize) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

/**
 * Send an error response
 */
function error(res, message = "Something went wrong", statusCode = 500, errors = null) {
  const response = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

module.exports = { success, created, paginated, error };
