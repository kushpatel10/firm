#!/usr/bin/env node

/**
 * Cloudflare Reverse Proxy Tunnel Runner
 * 
 * Supports both:
 * 1. Cloudflare Zero Trust Named Tunnel (Permanent Domain using Tunnel Token)
 *    Usage: CLOUDFLARE_TUNNEL_TOKEN=eyJh... npm run tunnel
 *    Or:    npm run tunnel -- eyJh...
 * 2. Quick Temporary HTTPS Tunnel (trycloudflare.com)
 *    Usage: npm run tunnel
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Load .env files if present
function loadEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const idx = trimmed.indexOf("=");
        if (idx > 0) {
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  } catch {}
}

loadEnvFile(path.resolve(__dirname, "..", ".env"));
loadEnvFile(path.resolve(__dirname, "..", "backend", ".env"));

// Check for token from CLI argument or environment variables
let token = process.env.CLOUDFLARE_TUNNEL_TOKEN || process.env.TUNNEL_TOKEN || null;

// Check CLI arguments for --token <token> or direct token string
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--token" && process.argv[i + 1]) {
    token = process.argv[i + 1];
    break;
  } else if (!process.argv[i].startsWith("-") && process.argv[i].length > 30) {
    token = process.argv[i];
    break;
  }
}

const TARGET_URL = process.env.TUNNEL_TARGET || "http://127.0.0.1:3000";
const isWin = process.platform === "win32";
const cmd = isWin ? "npx.cmd" : "npx";

let args = [];

if (token) {
  console.log("\n============================================================");
  console.log(" 🌐 CLOUDFLARE ZERO TRUST NAMED TUNNEL (PERMANENT DOMAIN)");
  console.log(" Connecting to your Cloudflare configured domain...");
  console.log(" Local Target: " + TARGET_URL);
  console.log("============================================================\n");
  args = ["-y", "cloudflared", "tunnel", "run", "--token", token];
} else {
  console.log("\n============================================================");
  console.log(" ⚡ QUICK CLOUDFLARE TUNNEL (trycloudflare.com)");
  console.log(" Local Target: " + TARGET_URL);
  console.log(" 💡 Tip: Set CLOUDFLARE_TUNNEL_TOKEN in .env to use your permanent domain.");
  console.log("============================================================\n");
  args = ["-y", "cloudflared", "tunnel", "--url", TARGET_URL];
}

const child = spawn(cmd, args, {
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

let bannerPrinted = false;

function checkForTunnelUrl(text) {
  if (bannerPrinted || token) return;
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    bannerPrinted = true;
    const tunnelUrl = match[0];
    const callbackUrl = `${tunnelUrl}/callback`;
    const line = "─".repeat(Math.max(68, tunnelUrl.length + 22));

    console.log(`\n┌${line}┐`);
    console.log(`│  🌐 CLOUDFLARE REVERSE PROXY ACTIVE`);
    console.log(`│`);
    console.log(`│  Public HTTPS URL:   ${tunnelUrl}`);
    console.log(`│  Local Proxy:        ${TARGET_URL} (Next.js + Express API)`);
    console.log(`│  OAuth Callback:     ${callbackUrl}`);
    console.log(`│`);
    console.log(`│  👉 Add this callback to Google Cloud Console Authorized Redirects:`);
    console.log(`│     ${callbackUrl}`);
    console.log(`└${line}┘\n`);
  }
}

child.stdout.on("data", (data) => {
  const text = data.toString();
  process.stdout.write(text);
  checkForTunnelUrl(text);
});

child.stderr.on("data", (data) => {
  const text = data.toString();
  process.stderr.write(text);
  checkForTunnelUrl(text);
});

child.on("error", (err) => {
  console.error("❌ Failed to start Cloudflare tunnel:", err.message);
  process.exit(1);
});

child.on("close", (code) => {
  console.log(`\n🛑 Cloudflare tunnel exited with code ${code}`);
  process.exit(code || 0);
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {
  child.kill("SIGTERM");
  process.exit(0);
});
