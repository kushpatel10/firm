/**
 * Auth Service
 * Handles Google OAuth verification, user lookup, and JWT generation.
 */

const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const prisma = require("../config/database");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

const googleClient = new OAuth2Client(
  config.googleClientId,
  config.googleClientSecret,
  config.googleRedirectUri
);

const authService = {
  /**
   * Exchange Google authorization code for user info and JWT.
   * @param {string} code - Google auth code
   * @returns {Promise<Object>} - { token, user, firm, role, permissions }
   */
  async handleGoogleCallback(code, redirectUri = null) {
    const resolvedRedirectUri = redirectUri || config.googleRedirectUri;
    // Exchange code for tokens
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: resolvedRedirectUri,
    });

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();
    const name = payload.name || email.split("@")[0];
    const avatar = payload.picture || null;

    // Look up user in PostgreSQL (case-insensitive)
    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
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

    // Auto-create/upgrade Super Admin if logging-in email matches configured SUPER_ADMIN_EMAIL
    const isConfiguredSuperAdmin =
      config.superAdminEmail &&
      email === config.superAdminEmail.toLowerCase();

    if (!user && isConfiguredSuperAdmin) {
      user = await prisma.user.create({
        data: {
          email: email,
          name: name,
          avatar: avatar,
          isSuperAdmin: true,
          status: "ACTIVE",
          lastLoginAt: new Date(),
        },
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
    }

    if (!user) {
      throw new ForbiddenError(
        "Access denied. Your Google account is not registered in the system."
      );
    }

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError(
        "Your account has been deactivated. Contact your administrator."
      );
    }

    // Update user profile from Google & ensure Super Admin status
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name,
        avatar: avatar,
        lastLoginAt: new Date(),
        ...(isConfiguredSuperAdmin && { isSuperAdmin: true }),
      },
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

    // Determine active firm
    const activeAssignment = user.firmAssignments?.[0];
    const firm = activeAssignment?.firm || null;
    const role = activeAssignment?.role || null;

    // Build permissions list
    const permissions =
      activeAssignment?.role?.permissions?.map(
        (rp) => `${rp.permission.module}.${rp.permission.action}`
      ) || [];

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        firmId: firm?.id || null,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin,
        status: user.status,
      },
      firm: firm
        ? {
            id: firm.id,
            name: firm.name,
            businessType: firm.businessType,
            currency: firm.currency,
            timezone: firm.timezone,
            status: firm.status,
          }
        : null,
      role: role
        ? {
            id: role.id,
            name: role.name,
            isSystem: role.isSystem,
          }
        : null,
      permissions,
    };
  },

  /**
   * Validate an existing JWT and return the session info.
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async validateToken(token) {
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await prisma.user.findUnique({
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

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("Session invalid");
    }

    const activeAssignment = decoded.firmId
      ? user.firmAssignments?.find((uf) => uf.firmId === decoded.firmId)
      : user.firmAssignments?.[0];

    const permissions =
      activeAssignment?.role?.permissions?.map(
        (rp) => `${rp.permission.module}.${rp.permission.action}`
      ) || [];

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin,
      },
      firm: activeAssignment?.firm || null,
      role: activeAssignment?.role || null,
      permissions,
    };
  },

  /**
   * Get the Google OAuth consent URL.
   * @param {string|null} redirectUri - Optional redirect URI override
   * @returns {string}
   */
  getGoogleAuthUrl(redirectUri = null) {
    return googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      redirect_uri: redirectUri || config.googleRedirectUri,
    });
  },

  /**
   * Credential login with Email and Password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async loginWithCredentials(email, password) {
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      throw new UnauthorizedError("Email address is required");
    }
    if (!password || typeof password !== "string") {
      throw new UnauthorizedError("Password is required");
    }

    // Verify configured password
    const configuredPassword = process.env.ADMIN_PASSWORD || process.env.DEV_PASSWORD;
    if (config.nodeEnv === "production") {
      if (!configuredPassword) {
        throw new UnauthorizedError("Password authentication is disabled in production. Please sign in with Google.");
      }
      if (password !== configuredPassword) {
        throw new UnauthorizedError("Invalid email or password");
      }
    } else {
      const devAllowedPassword = configuredPassword || "admin123";
      if (password !== devAllowedPassword) {
        throw new UnauthorizedError("Invalid email or password");
      }
    }

    const superAdminEmail = (config.superAdminEmail || "kvpatel.in004@gmail.com").toLowerCase();
    const isConfiguredSuperAdmin = normalizedEmail === superAdminEmail;

    // Look up user in PostgreSQL
    let user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
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

    // Auto-provision configured Super Admin if logging in for first time
    if (!user && (isConfiguredSuperAdmin || (config.nodeEnv !== "production" && normalizedEmail.includes("admin")))) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: isConfiguredSuperAdmin ? "Super Admin" : normalizedEmail.split("@")[0],
          isSuperAdmin: true,
          status: "ACTIVE",
          lastLoginAt: new Date(),
        },
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
    }

    if (!user) {
      throw new UnauthorizedError(
        "No registered organizational account found for this email. Please check your credentials or continue with Google."
      );
    }

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError(
        "Your account has been deactivated. Contact your administrator."
      );
    }

    let activeAssignment = user.firmAssignments?.[0];
    let firm = activeAssignment?.firm || null;
    let role = activeAssignment?.role || null;

    if (!firm) {
      firm = await prisma.firm.upsert({
        where: { id: "dev-firm-001" },
        update: { status: "ACTIVE" },
        create: {
          id: "dev-firm-001",
          name: "Dev Firm",
          businessType: "Technology",
          currency: "INR",
          timezone: "Asia/Kolkata",
          status: "ACTIVE",
        },
      });

      const ownerRole = await prisma.role.findFirst({
        where: { name: "Owner", isSystem: true },
      });

      if (ownerRole) {
        await prisma.userFirm.upsert({
          where: { userId_firmId: { userId: user.id, firmId: firm.id } },
          update: { status: "ACTIVE" },
          create: {
            userId: user.id,
            firmId: firm.id,
            roleId: ownerRole.id,
            status: "ACTIVE",
          },
        });
        role = ownerRole;
      }
    }

    const permissions =
      activeAssignment?.role?.permissions?.map(
        (rp) => `${rp.permission.module}.${rp.permission.action}`
      ) || (user.isSuperAdmin ? [
        "Sales.View", "Sales.Create", "Sales.Edit", "Sales.Delete",
        "Purchase.View", "Purchase.Create", "Purchase.Edit", "Purchase.Delete",
        "Expense.View", "Expense.Create", "Expense.Edit", "Expense.Delete",
        "Inventory.View", "Inventory.Create", "Inventory.Edit", "Inventory.Delete",
        "Customers.View", "Customers.Create", "Customers.Edit", "Customers.Delete",
        "Suppliers.View", "Suppliers.Create", "Suppliers.Edit", "Suppliers.Delete",
        "DeliveryChallans.View", "DeliveryChallans.Create", "DeliveryChallans.Edit", "DeliveryChallans.Delete",
        "Reports.View", "Settings.Manage", "Users.Manage",
      ] : []);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        firmId: firm?.id || null,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin,
        status: user.status,
      },
      firm: firm ? { id: firm.id, name: firm.name, status: firm.status } : null,
      role: role ? { id: role.id, name: role.name, isSystem: role.isSystem } : null,
      permissions,
    };
  },

  /**
   * Development login — returns a valid JWT for Super Admin user.
   */
  async devLogin() {
    const superAdminEmail = (config.superAdminEmail || "kvpatel.in004@gmail.com").toLowerCase();
    let user = await prisma.user.findFirst({
      where: { email: { equals: superAdminEmail, mode: "insensitive" } },
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

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: superAdminEmail,
          name: "Super Admin",
          isSuperAdmin: true,
          status: "ACTIVE",
        },
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
    }

    let activeAssignment = user.firmAssignments?.[0];
    let firm = activeAssignment?.firm || null;
    let role = activeAssignment?.role || null;

    if (!firm) {
      firm = await prisma.firm.upsert({
        where: { id: "dev-firm-001" },
        update: { status: "ACTIVE" },
        create: {
          id: "dev-firm-001",
          name: "Dev Firm",
          businessType: "Technology",
          currency: "INR",
          timezone: "Asia/Kolkata",
          status: "ACTIVE",
        },
      });

      const ownerRole = await prisma.role.findFirst({
        where: { name: "Owner", isSystem: true },
      });

      if (ownerRole) {
        await prisma.userFirm.upsert({
          where: { userId_firmId: { userId: user.id, firmId: firm.id } },
          update: { status: "ACTIVE" },
          create: {
            userId: user.id,
            firmId: firm.id,
            roleId: ownerRole.id,
            status: "ACTIVE",
          },
        });
        role = ownerRole;
      }
    }

    const permissions = activeAssignment?.role?.permissions?.map(
      (rp) => `${rp.permission.module}.${rp.permission.action}`
    ) || [
      "Sales.View", "Sales.Create", "Sales.Edit", "Sales.Delete",
      "Purchase.View", "Purchase.Create", "Purchase.Edit", "Purchase.Delete",
      "Expense.View", "Expense.Create", "Expense.Edit", "Expense.Delete",
      "Inventory.View", "Inventory.Create", "Inventory.Edit", "Inventory.Delete",
      "Customers.View", "Customers.Create", "Customers.Edit", "Customers.Delete",
      "Suppliers.View", "Suppliers.Create", "Suppliers.Edit", "Suppliers.Delete",
      "DeliveryChallans.View", "DeliveryChallans.Create", "DeliveryChallans.Edit", "DeliveryChallans.Delete",
      "Reports.View", "Settings.Manage", "Users.Manage",
    ];

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        firmId: firm?.id || null,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin,
        status: user.status,
      },
      firm: firm ? { id: firm.id, name: firm.name, status: firm.status } : null,
      role: role ? { id: role.id, name: role.name, isSystem: role.isSystem } : null,
      permissions,
    };
  },
};

module.exports = authService;
