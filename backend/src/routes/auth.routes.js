/**
 * Auth routes.
 */

const { Router } = require("express");
const authService = require("../services/auth.service");
const config = require("../config/env");
const { success, error } = require("../utils/response");
const { authenticate } = require("../middleware/auth");

const router = Router();

// GET /api/auth/google — Get Google OAuth consent URL
router.get("/google", (req, res) => {
  const url = authService.getGoogleAuthUrl();
  success(res, { url });
});

// POST /api/auth/callback — Handle Google OAuth callback
router.post("/callback", async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) return error(res, "Authorization code is required", 400);

    const result = await authService.handleGoogleCallback(code, redirectUri);

    // Set token as httpOnly cookie as well
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/dev-login — Development login endpoint (disabled in production)
router.post("/dev-login", async (req, res, next) => {
  if (config.nodeEnv === "production") {
    return error(res, "Endpoint not available in production", 404);
  }
  try {
    const result = await authService.devLogin();
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    success(res, result);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/session — Validate current session
router.get("/session", authenticate, async (req, res) => {
  success(res, {
    user: req.user,
    firm: req.firm,
    role: req.role,
    permissions: req.permissions,
  });
});

const userCache = require("../utils/user-cache");

// POST /api/auth/logout — Clear session
router.post("/logout", (req, res) => {
  // Extract token if present to invalidate cached session
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.token;
  if (token && token !== "dev-token") {
    try {
      const config = require("../config/env");
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, config.jwtSecret);
      if (decoded?.userId) {
        userCache.invalidate(decoded.userId);
      }
    } catch {
      // Ignore token verification errors during logout
    }
  }

  res.clearCookie("token");
  success(res, null, "Logged out successfully");
});

module.exports = router;
