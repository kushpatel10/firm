/**
 * Authentication middleware.
 * Verifies JWT from Authorization header or cookie.
 */

const jwt = require("jsonwebtoken");
const config = require("../config/env");
const prisma = require("../config/database");
const { UnauthorizedError } = require("../utils/errors");
const userCache = require("../utils/user-cache");

/**
 * Require authentication — attaches req.user, req.firmId, req.role, req.permissions
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from header or cookie
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError("No authentication token provided");
    }

    if (token === "dev-token") {
      if (config.nodeEnv === "production") {
        throw new UnauthorizedError("Dev token not permitted in production");
      }
      req.user = {
        id: "dev-user-001",
        email: config.superAdminEmail || "admin@example.com",
        name: "Dev Admin",
        avatar: null,
        isSuperAdmin: true,
        status: "ACTIVE",
      };
      req.firmId = "dev-firm-001";
      req.branchId = null;
      req.role = { id: "dev-role-001", name: "Owner", isSystem: true };
      req.permissions = [
        "Sales.View", "Sales.Create", "Sales.Edit", "Sales.Delete",
        "Purchase.View", "Purchase.Create", "Purchase.Edit", "Purchase.Delete",
        "Expense.View", "Expense.Create", "Expense.Edit", "Expense.Delete",
        "Inventory.View", "Inventory.Create", "Inventory.Edit", "Inventory.Delete",
        "Customers.View", "Customers.Create", "Customers.Edit", "Customers.Delete",
        "Suppliers.View", "Suppliers.Create", "Suppliers.Edit", "Suppliers.Delete",
        "DeliveryChallans.View", "DeliveryChallans.Create", "DeliveryChallans.Edit", "DeliveryChallans.Delete",
        "Reports.View", "Settings.Manage", "Users.Manage",
      ];
      req.firm = {
        id: "dev-firm-001",
        name: "Dev Firm",
        businessType: "Technology",
        currency: "INR",
        timezone: "Asia/Kolkata",
        status: "ACTIVE",
      };
      req.userAssignments = [];
      return next();
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    // Check fast in-memory user cache first to avoid repetitive 5-table cloud DB round-trip
    let user = userCache.get(decoded.userId);

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          firmAssignments: {
            where: { status: "ACTIVE" },
            include: {
              firm: true,
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (user && user.status === "ACTIVE") {
        userCache.set(decoded.userId, user);
      }
    }

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("User account is inactive or not found");
    }

    // Determine active firm (from token or first active assignment)
    const activeFirmId = decoded.firmId || user.firmAssignments?.[0]?.firmId;
    const activeAssignment = user.firmAssignments?.find((uf) => uf.firmId === activeFirmId);

    // Build permissions array
    const permissions = activeAssignment?.role?.permissions?.map(
      (rp) => `${rp.permission.module}.${rp.permission.action}`
    ) || [];

    // Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isSuperAdmin: user.isSuperAdmin,
      status: user.status,
    };

    req.firmId = activeFirmId || null;
    req.branchId = activeAssignment?.branchId || null;
    req.role = activeAssignment?.role || null;
    req.permissions = permissions;
    req.firm = activeAssignment?.firm || null;
    req.userAssignments = user.firmAssignments || [];

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication — does not fail if no token present
 */
async function optionalAuth(req, res, next) {
  try {
    await authenticate(req, res, () => {});
  } catch {
    // Ignore errors — user remains undefined
  }
  next();
}

/**
 * Require Super Admin access
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user?.isSuperAdmin) {
    return next(new ForbiddenError("Super Admin access required"));
  }
  next();
}

module.exports = { authenticate, optionalAuth, requireSuperAdmin };
