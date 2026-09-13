/**
 * Tenant isolation middleware.
 * Ensures firmId is set and validates access.
 */

const { ForbiddenError, ValidationError } = require("../utils/errors");

/**
 * Require a valid firmId — either from the URL or the user's session.
 * Super Admins can access any firm.
 */
function requireFirm(req, res, next) {
  const firmIdParam = req.params.firmId;

  if (firmIdParam) {
    // If a firmId is in the URL, validate the user has access
    const assignment = req.userAssignments?.find((fa) => fa.firmId === firmIdParam);
    if (!req.user?.isSuperAdmin && req.firmId !== firmIdParam && !assignment) {
      return next(new ForbiddenError("You do not have access to this firm"));
    }
    req.activeFirmId = firmIdParam;

    // Recalculate firm-specific context and permissions for this active firm
    if (!req.user?.isSuperAdmin && assignment) {
      req.firm = assignment.firm || req.firm;
      req.role = assignment.role || req.role;
      req.branchId = assignment.branchId || null;
      if (assignment.role?.permissions) {
        req.permissions = assignment.role.permissions.map(
          (rp) => `${rp.permission.module}.${rp.permission.action}`
        );
      }
    }
  } else if (req.firmId) {
    req.activeFirmId = req.firmId;
  } else {
    return next(new ValidationError("No firm context. Please select a firm."));
  }

  next();
}

/**
 * Attach firmId filter for Prisma queries.
 * Usage: After requireFirm, use req.firmFilter in service queries.
 */
function firmFilter(req, res, next) {
  req.firmFilter = { firmId: req.activeFirmId };
  next();
}

module.exports = { requireFirm, firmFilter };
