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
const categoryRoutes = require("./routes/category.routes");
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
const backupRoutes = require("./routes/backup.routes");
const { initScheduler } = require("./services/scheduler.service");

const app = express();

// --- Global Middleware ---

// Trust proxy — essential for Cloudflare Tunnel, CF-Connecting-IP & X-Forwarded-Proto
app.set("trust proxy", true);

// Reverse Proxy & Tunnel Context Middleware (Tailscale Funnel, Cloudflare, Nginx)
app.use((req, res, next) => {
  // Capture real client IP through reverse proxy
  req.clientIp =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0].trim() : req.ip);
  req.cfRay = req.headers["cf-ray"];
  req.cfCountry = req.headers["cf-ipcountry"];
  const forwardedProto = req.headers["x-forwarded-proto"];
  const hostHeader = req.headers["x-forwarded-host"] || req.headers["host"] || "";
  req.isHttps =
    forwardedProto === "https" ||
    req.secure ||
    hostHeader.includes(".ts.net") ||
    (config.publicUrl && config.publicUrl.startsWith("https://"));
  req.proxyHost = hostHeader;
  next();
});

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Fast HTTP response compression (gzip/deflate)
app.use(compression());

// CORS — allow frontend, mobile Capacitor, local IPs, Tailscale Funnel, and Cloudflare origins
const allowedOrigins = [
  config.frontendUrl,
  config.publicUrl,
  "http://localhost:3000",
  "http://localhost:4000",
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "https://com.firm.app",
  "https://com.bcalc.app",
  "capacitor://com.bcalc.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (native mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Match allowed list, LAN IPs, Tailscale Funnel (.ts.net), or Cloudflare origins
      if (
        allowedOrigins.includes(origin) ||
        origin.includes(".ts.net") ||
        origin.includes("trycloudflare.com") ||
        origin.includes("cloudflare") ||
        origin.includes("pages.dev") ||
        origin.includes("workers.dev") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        config.nodeEnv !== "production"
      ) {
        return callback(null, true);
      }
      // Behind reverse proxy or Next.js internal rewrite proxy, allow the request
      return callback(null, true);
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

// Tenant-scoped business routes (mounted before general /api/firms admin router)
app.use("/api/firms/:firmId/categories", categoryRoutes);
app.use("/api/firms/:firmId/sales", salesRoutes);
app.use("/api/firms/:firmId/purchases", purchaseRoutes);
app.use("/api/firms/:firmId/expenses", expenseRoutes);
app.use("/api/firms/:firmId/inventory", inventoryRoutes);
app.use("/api/firms/:firmId/customers", customerRoutes);
app.use("/api/firms/:firmId/suppliers", supplierRoutes);
app.use("/api/firms/:firmId/delivery-challans", deliveryChallanRoutes);
app.use("/api/firms/:firmId/branches", branchRoutes);
app.use("/api/firms/:firmId/reports", reportRoutes);
app.use("/api/firms/:firmId/backup", backupRoutes);

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

const prisma = require("./config/database");

// --- Start Server ---
const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`\n🚀 Firm API running on http://0.0.0.0:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Frontend: ${config.frontendUrl}`);
  if (config.publicUrl && config.publicUrl !== config.frontendUrl) {
    console.log(`   Public URL: ${config.publicUrl}`);
  }
  console.log(`   Health: http://0.0.0.0:${config.port}/api/health`);

  // Pre-warm database connection pool to eliminate cold-start query penalty
  prisma.$connect()
    .then(() => {
      console.log("   Database: Connection pool pre-warmed & ready\n");
      initScheduler();
    })
    .catch((err) => console.warn("   Database warning:", err.message));
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Error: Port ${config.port} is already in use by another process! Run: sudo fuser -k ${config.port}/tcp\n`);
    process.exit(1);
  } else {
    console.error(`\n❌ Server error:`, err);
  }
});

module.exports = app;
