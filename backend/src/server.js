/**
 * Express server entry point.
 * Firm — Multi-Tenant Business Management API
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

const config = require("./config/env");
const errorHandler = require("./middleware/error-handler");

// Route imports
const authRoutes = require("./routes/auth.routes");
const firmRoutes = require("./routes/firm.routes");
const userRoutes = require("./routes/user.routes");
const roleRoutes = require("./routes/role.routes");
const activityRoutes = require("./routes/activity.routes");
const salesRoutes = require("./routes/sales.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const expenseRoutes = require("./routes/expense.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const customerRoutes = require("./routes/customer.routes");
const supplierRoutes = require("./routes/supplier.routes");
const deliveryChallanRoutes = require("./routes/delivery-challan.routes");
const branchRoutes = require("./routes/branch.routes");
const reportRoutes = require("./routes/report.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

// --- Global Middleware ---

// Trust proxy — essential for Cloudflare Tunnel, CF-Connecting-IP & X-Forwarded-Proto
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Fast HTTP response compression (gzip/deflate)
app.use(compression());

// CORS — allow frontend, mobile Capacitor, local IPs, and Cloudflare Tunnel origins
const allowedOrigins = [
  config.frontendUrl,
  "http://localhost:3000",
  "http://localhost:4000",
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "https://com.firm.app",
  "https://com.bcalc.app",
  "capacitor://com.bcalc.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (native mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Match allowed list, LAN IPs, or Cloudflare Tunnel origins
      if (
        allowedOrigins.includes(origin) ||
        origin.includes("trycloudflare.com") ||
        origin.includes("cloudflare") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        config.nodeEnv !== "production"
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Request parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.nodeEnv !== "test") {
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
}

// Rate limiting — tuned for high concurrency with health check skip
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2500,
  skip: (req) => req.path === "/api/health",
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { success: false, message: "Too many requests, try again later." },
});
app.use("/api/", limiter);

// --- Health Check ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Firm API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// --- API Routes ---

// Auth (no tenant scope)
app.use("/api/auth", authRoutes);

// Dashboard routes
app.use("/api", dashboardRoutes);

const vaultRoutes = require("./routes/vault.routes");

// Tenant-scoped business routes (mounted before general /api/firms admin router)
app.use("/api/firms/:firmId/vault", vaultRoutes);
app.use("/api/firms/:firmId/sales", salesRoutes);
app.use("/api/firms/:firmId/purchases", purchaseRoutes);
app.use("/api/firms/:firmId/expenses", expenseRoutes);
app.use("/api/firms/:firmId/inventory", inventoryRoutes);
app.use("/api/firms/:firmId/customers", customerRoutes);
app.use("/api/firms/:firmId/suppliers", supplierRoutes);
app.use("/api/firms/:firmId/delivery-challans", deliveryChallanRoutes);
app.use("/api/firms/:firmId/branches", branchRoutes);
app.use("/api/firms/:firmId/reports", reportRoutes);

// Admin routes (Super Admin)
app.use("/api/firms", firmRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/activity", activityRoutes);


// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --- Error Handler ---
app.use(errorHandler);

// --- Start Server ---
app.listen(config.port, "0.0.0.0", () => {
  console.log(`\n🚀 Firm API running on http://0.0.0.0:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Frontend: ${config.frontendUrl}`);
  console.log(`   Health: http://0.0.0.0:${config.port}/api/health\n`);
});

module.exports = app;
