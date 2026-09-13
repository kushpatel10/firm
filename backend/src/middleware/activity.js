/**
 * Activity logging middleware.
 * Automatically logs write operations (POST, PUT, PATCH, DELETE).
 */

const prisma = require("../config/database");

/**
 * Log activity after a successful write operation.
 * @param {string} action - e.g., "CREATE", "UPDATE", "DELETE"
 * @param {string} entityType - e.g., "Sale", "Firm", "User"
 */
function logActivity(action, entityType) {
  return async (req, res, next) => {
    // Store the original json method
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Only log if the response was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = body?.data?.id || req.params.id || null;

        // Fire and forget — don't block the response
        prisma.activityLog
          .create({
            data: {
              userId: req.user?.id || null,
              firmId: req.activeFirmId || req.firmId || null,
              action,
              entityType,
              entityId,
              details: {
                method: req.method,
                path: req.originalUrl,
                ip: req.ip,
                userAgent: req.get("user-agent"),
              },
              ipAddress: req.ip,
            },
          })
          .catch((err) => {
            console.error("Activity logging failed:", err.message);
          });
      }

      return originalJson(body);
    };

    next();
  };
}

module.exports = { logActivity };
