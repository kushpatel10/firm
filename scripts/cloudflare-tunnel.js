#!/usr/bin/env node

/**
 * Cloudflare Reverse Proxy Tunnel Runner
 * Automatically provisions a secure public HTTPS reverse proxy tunnel pointing to port 3000.
 * Extracts and displays the public URL in a clear, formatted banner.
 */

const { spawn } = require("child_process");

const TARGET_URL = process.env.TUNNEL_TARGET || "http://127.0.0.1:3000";

console.log("\n🚀 Starting Cloudflare Reverse Proxy Tunnel to " + TARGET_URL + "...\n");

const isWin = process.platform === "win32";
const cmd = isWin ? "npx.cmd" : "npx";
const args = ["-y", "cloudflared", "tunnel", "--url", TARGET_URL];

const child = spawn(cmd, args, {
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

let bannerPrinted = false;

function checkForTunnelUrl(text) {
  if (bannerPrinted) return;
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
