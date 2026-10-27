/**
 * Autonomous Video Recorder & Voiceover Merger (Real-Time 15 FPS Frame Pump)
 * Ensures butter-smooth real-time video perfectly synchronized with the audio.
 */

const puppeteer = require("puppeteer-core");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "https://scraper.tail3aad92.ts.net";
const AUDIO_FILE = path.resolve(__dirname, "..", "firm_demo_voiceover.mp3");
const OUTPUT_VIDEO = path.resolve(__dirname, "..", "final_demo_submission.mp4");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("🎬 Starting Real-Time Autonomous Browser Video Recording...");

  if (!fs.existsSync(AUDIO_FILE)) {
    throw new Error(`Audio file not found: ${AUDIO_FILE}`);
  }

  // 1. Launch FFmpeg child process
  const ffmpegArgs = [
    "-y",
    "-f", "image2pipe",
    "-vcodec", "mjpeg",
    "-framerate", "15",
    "-i", "-",
    "-i", AUDIO_FILE,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "veryfast",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    OUTPUT_VIDEO,
  ];

  console.log("🚀 Spawning FFmpeg process...");
  const ffmpeg = spawn("ffmpeg", ffmpegArgs, { stdio: ["pipe", "pipe", "pipe"] });

  ffmpeg.stderr.on("data", () => {});

  // 2. Launch Puppeteer Chrome
  console.log("🌐 Launching Chrome at 1280x720...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1280,720",
      "--disable-gpu",
    ],
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();
  const client = await page.target().createCDPSession();

  // 3. Frame Pump: Ensures continuous 15 fps stream into FFmpeg
  let currentFrame = null;
  let isRecording = true;

  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: 85,
    everyNthFrame: 1,
  });

  client.on("Page.screencastFrame", async ({ data, sessionId }) => {
    currentFrame = Buffer.from(data, "base64");
    try {
      await client.send("Page.screencastFrameAck", { sessionId });
    } catch {}
  });

  const frameInterval = setInterval(() => {
    if (isRecording && currentFrame && ffmpeg.stdin.writable) {
      ffmpeg.stdin.write(currentFrame);
    }
  }, 1000 / 15);

  console.log("🎥 Real-time 15 FPS Screencast active! Navigating synchronized flows...");

  try {
    // --- SCENE 1: Login Page (0 - 18s) ---
    console.log("📍 [0:00] Visiting /login...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await sleep(6000);

    console.log("👉 [0:06] Clicking Evaluator 1-Click Access...");
    const devBtn = await page.$("#dev-login-btn");
    if (devBtn) {
      await devBtn.click();
    } else {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle2" });
    }
    await sleep(10000);

    // --- SCENE 2: Admin Portal (18 - 52s) ---
    console.log("📍 [0:18] Visiting /admin (Firms, Roles, Users)...");
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle2" });
    await sleep(8000);

    // Click Roles
    try {
      const tabs = await page.$$("button, a");
      for (const t of tabs) {
        const text = await page.evaluate(el => el.innerText.trim(), t);
        if (text === "Roles") {
          await t.click();
          break;
        }
      }
    } catch {}
    await sleep(10000);

    // Click Users
    try {
      const tabs = await page.$$("button, a");
      for (const t of tabs) {
        const text = await page.evaluate(el => el.innerText.trim(), t);
        if (text === "Users") {
          await t.click();
          break;
        }
      }
    } catch {}
    await sleep(10000);

    // --- SCENE 3: Dashboard & Sales (52 - 95s) ---
    console.log("📍 [0:52] Visiting /dashboard...");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2" });
    await sleep(8000);

    console.log("📍 [1:00] Visiting /dashboard/sales...");
    await page.goto(`${BASE_URL}/dashboard/sales`, { waitUntil: "networkidle2" });
    await sleep(6000);

    // Try clicking Create Sale button
    try {
      const btns = await page.$$("button, a");
      for (const b of btns) {
        const txt = await page.evaluate(el => el.innerText.trim(), b);
        if (txt.includes("Create Sale") || txt.includes("New Sale") || txt.includes("New Voucher")) {
          await b.click();
          break;
        }
      }
    } catch {}
    await sleep(15000);
    await page.evaluate(() => window.scrollBy({ top: 250, behavior: "smooth" }));
    await sleep(5000);

    // --- SCENE 4: Delivery Challans & Ledgers (95 - 130s) ---
    console.log("📍 [1:35] Visiting /dashboard/delivery-challans...");
    await page.goto(`${BASE_URL}/dashboard/delivery-challans`, { waitUntil: "networkidle2" }).catch(() => {});
    await sleep(12000);

    console.log("📍 [1:47] Visiting /dashboard/customers...");
    await page.goto(`${BASE_URL}/dashboard/customers`, { waitUntil: "networkidle2" }).catch(() => {});
    await sleep(10000);

    console.log("📍 [1:57] Visiting /dashboard/suppliers...");
    await page.goto(`${BASE_URL}/dashboard/suppliers`, { waitUntil: "networkidle2" }).catch(() => {});
    await sleep(10000);

    // --- SCENE 5: Inventory & Expenses (130 - 155s) ---
    console.log("📍 [2:10] Visiting /dashboard/inventory...");
    await page.goto(`${BASE_URL}/dashboard/inventory`, { waitUntil: "networkidle2" });
    await sleep(12000);

    console.log("📍 [2:22] Visiting /dashboard/expenses...");
    await page.goto(`${BASE_URL}/dashboard/expenses`, { waitUntil: "networkidle2" });
    await sleep(10000);

    // --- SCENE 6: Omni-Scale (155 - 175s) ---
    console.log("📍 [2:35] Visiting /dashboard/omni-scale...");
    await page.goto(`${BASE_URL}/dashboard/omni-scale`, { waitUntil: "networkidle2" });
    await sleep(8000);
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: "smooth" }));
    await sleep(10000);

    // --- SCENE 7: Settings & Zero-Knowledge Backup (175 - 192s) ---
    console.log("📍 [2:55] Visiting /dashboard/settings (Backup & Cloud Sync)...");
    await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: "networkidle2" });
    await sleep(4000);

    try {
      const tabs = await page.$$("button, a");
      for (const t of tabs) {
        const text = await page.evaluate(el => el.innerText.trim(), t);
        if (text.includes("Backup") || text.includes("Cloud")) {
          await t.click();
          break;
        }
      }
    } catch {}
    await sleep(16000);

    console.log("✅ All scenes recorded in real-time!");
  } finally {
    isRecording = false;
    clearInterval(frameInterval);
    await client.send("Page.stopScreencast").catch(() => {});
    await browser.close().catch(() => {});
    ffmpeg.stdin.end();
  }

  // Wait for FFmpeg to finish
  await new Promise((resolve) => {
    ffmpeg.on("close", (code) => {
      console.log(`🎉 FFmpeg successfully encoded video with exit code ${code}`);
      resolve();
    });
  });

  console.log(`\n🏆 MASTER DEMO VIDEO COMPLETE: ${OUTPUT_VIDEO}`);
}

main().catch((err) => {
  console.error("❌ Error during recording:", err);
  process.exit(1);
});
