/**
 * Permission checking middleware.
 * Works with the dynamic Role → Permission system.
 */

const { ForbiddenError } = require("../utils/errors");

/**
 * Require a specific permission (e.g., "Sales.Create").
 * Super Admins bypass all permission checks.
 */
function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (req.user.isSuperAdmin) return next();

    if (!req.permissions || !req.permissions.includes(permissionCode)) {
      return next(
        new ForbiddenError(
          `Permission denied. Required: ${permissionCode}`
        )
      );
    }

    next();
  };
}

/**
 * Require any of the specified permissions.
 */
function requireAnyPermission(...permissionCodes) {
  return (req, res, next) => {
    if (req.user.isSuperAdmin) return next();

    const hasAny = permissionCodes.some(
      (code) => req.permissions && req.permissions.includes(code)
    );

    if (!hasAny) {
      return next(
        new ForbiddenError(
          `Permission denied. Required one of: ${permissionCodes.join(", ")}`
        )
      );
    }

    next();
  };
}

module.exports = { requirePermission, requireAnyPermission };
