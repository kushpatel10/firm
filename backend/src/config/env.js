/**
 * Environment configuration.
 * Loads from .env and validates required variables.
 */

require("dotenv").config();

const config = {
  // Server
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/callback",

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Super Admin
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || "admin@example.com",
};

module.exports = config;
