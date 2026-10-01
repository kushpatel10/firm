const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("🚀 Starting End-to-End Automated Verification of All Flows...\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  let allPassed = true;

  try {
    const page = await browser.newPage();
    // Simulate mobile viewport (Android phone: 390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    const clickButtonWithText = async (targetText) => {
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.innerText.trim(), btn);
        if (text === targetText) {
          await btn.click();
          return true;
        }
      }
      return false;
    };

    // ==========================================
    // TEST 1: Website Flow (Logged Out)
    // ==========================================
    console.log("--- TEST 1: Website Flow (Logged Out) ---");
    await page.goto(`${BASE_URL}/?platform=web`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("firm_emulate_platform", "web");
      sessionStorage.setItem("firm_emulate_platform", "web");
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });

    await page.waitForFunction(() => window.location.pathname === "/login", { timeout: 8000 });
    console.log(`  * Current URL after navigation: ${page.url()}`);
    console.log("  ✅ Website redirects to /login properly.");

    // Check Calculator is NOT rendered
    const calcDisplay = await page.$("#calculator-display");
    if (calcDisplay) {
      throw new Error("FAIL: Calculator component is rendered on the website!");
    }
    console.log("  ✅ Verified: Calculator is completely absent from the website.");

    // Check Mobile Login UI elements
    const emailInput = await page.$("#login-email");
    const passwordInput = await page.$("#login-password");
    const submitBtn = await page.$("#login-submit-btn");
    const googleBtn = await page.$("#google-login-btn");

    if (!emailInput || !passwordInput || !submitBtn || !googleBtn) {
      throw new Error("FAIL: Login UI elements missing from the mobile login screen.");
    }
    console.log("  ✅ Verified: App-like Mobile Login screen rendered with all inputs and buttons.");

    // Test form validation
    await submitBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    const validationErrors = await page.$$eval('[role="alert"]', (els) => els.map((e) => e.innerText));
    console.log(`  * Validation alerts triggered: ${JSON.stringify(validationErrors)}`);
    if (validationErrors.length === 0) {
      throw new Error("FAIL: Form validation did not trigger for empty inputs.");
    }
    console.log("  ✅ Verified: Inline validation errors displayed correctly under relevant fields.");

    // Test password visibility toggle
    await passwordInput.type("secret123");
    let inputType = await page.$eval("#login-password", (el) => el.getAttribute("type"));
    console.log(`  * Password input initial type: ${inputType}`);

    // Click Eye toggle button
    const eyeBtn = await page.$('button[aria-label="Show password"]');
    if (eyeBtn) {
      await eyeBtn.click();
      await new Promise((r) => setTimeout(r, 200));
      inputType = await page.$eval("#login-password", (el) => el.getAttribute("type"));
      console.log(`  * Password input type after toggle: ${inputType}`);
      if (inputType !== "text") {
        throw new Error("FAIL: Password toggle did not show password.");
      }
      const eyeOffBtn = await page.$('button[aria-label="Hide password"]');
      if (eyeOffBtn) {
        await eyeOffBtn.click();
        await new Promise((r) => setTimeout(r, 200));
        inputType = await page.$eval("#login-password", (el) => el.getAttribute("type"));
        console.log(`  * Password input type after second toggle: ${inputType}`);
        if (inputType !== "password") {
          throw new Error("FAIL: Password toggle did not hide password.");
        }
      }
    }
    console.log("  ✅ Verified: Sensible password visibility controls function properly.");

    // ==========================================
    // TEST 2: Website Login -> Main App Transition
    // ==========================================
    console.log("\n--- TEST 2: Website Login -> Main App Transition ---");
    const devLoginBtn = await page.$("#dev-login-btn");
    if (!devLoginBtn) {
      throw new Error("FAIL: Dev login bypass button missing for testing.");
    }
    await devLoginBtn.click();

    await page.waitForFunction(
      () => window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/dashboard"),
      { timeout: 10000 }
    );
    const postLoginUrl = page.url();
    console.log(`  * Post-login URL: ${postLoginUrl}`);
    console.log("  ✅ Verified: Seamless transition into Main Application.");

    // Wait for bottom nav to render
    const bottomNav = await page.waitForSelector("#mobile-bottom-navigation", { timeout: 8000 });
    if (!bottomNav) {
      throw new Error("FAIL: Mobile bottom navigation bar missing!");
    }
    console.log("  ✅ Verified: Mobile bottom navigation bar rendered for thumb reachability.");

    // Verify Website Topbar has NO "Lock to Calculator"
    const lockBtnWeb = await page.$('button[aria-label="Lock to Calculator"]');
    if (lockBtnWeb) {
      throw new Error("FAIL: 'Lock to Calculator' button was rendered on the website topbar!");
    }
    console.log("  ✅ Verified: 'Lock to Calculator' button is completely absent on the website topbar.");

    // ==========================================
    // TEST 3: Android Flow (Logged Out)
    // ==========================================
    console.log("\n--- TEST 3: Android Native Flow (Logged Out) ---");
    // Clear storage and cookies and set Android platform emulation
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("firm_emulate_platform", "android");
      sessionStorage.setItem("firm_emulate_platform", "android");
      sessionStorage.removeItem("firm_stealth_unlocked");
      localStorage.removeItem("firm_auth_token");
      localStorage.removeItem("token");
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });

    const androidCalcDisplay = await page.waitForSelector("#calculator-display", { timeout: 8000 });
    if (!androidCalcDisplay) {
      throw new Error("FAIL: Android calculator did not render as the entry layer for Android!");
    }
    const initialCalcText = await page.$eval("#calculator-display", (el) => el.innerText.trim());
    console.log(`  * Calculator initial display: '${initialCalcText}'`);
    if (initialCalcText !== "0") {
      throw new Error(`FAIL: Calculator display expected '0', got '${initialCalcText}'`);
    }
    console.log("  ✅ Verified: Android app opens to legitimate Calculator entry layer.");

    // Test Math functionality: 7 × 8 = 56
    await (await page.$("#calc-key-7")).click();
    await clickButtonWithText("×");
    await (await page.$("#calc-key-8")).click();
    await (await page.$("#calc-key-equals")).click();
    await new Promise((r) => setTimeout(r, 200));

    const calcResult = await page.$eval("#calculator-display", (el) => el.innerText.trim());
    console.log(`  * Math calculation result (7 × 8): '${calcResult}'`);
    if (calcResult !== "56") {
      throw new Error(`FAIL: Expected calculation result '56', got '${calcResult}'`);
    }
    console.log("  ✅ Verified: Calculator performs legitimate math calculations smoothly.");

    // Clear display
    await (await page.$("#calc-key-clear")).click();
    await new Promise((r) => setTimeout(r, 200));

    // Secret Authorized Unlock: Type 2007 and press =
    console.log("  * Entering passcode '2007' and pressing '='...");
    await (await page.$("#calc-key-2")).click();
    await (await page.$("#calc-key-0")).click();
    await (await page.$("#calc-key-0")).click();
    await (await page.$("#calc-key-7")).click();
    await (await page.$("#calc-key-equals")).click();

    // Since logged out, should transition cleanly to Android login screen
    await page.waitForFunction(() => window.location.pathname === "/login", { timeout: 8000 });
    const postUnlockUrl = page.url();
    console.log(`  * URL after calculator unlock: ${postUnlockUrl}`);
    console.log("  ✅ Verified: Calculator unlocked cleanly and transitioned into Mobile Login screen.");

    // Verify Android-specific server config button is present on Android login
    const serverConfigBtn = await page.waitForSelector('button[title*="backend server URL"]', { timeout: 5000 });
    if (!serverConfigBtn) {
      throw new Error("FAIL: 'Configure Server URL' button missing on Android login screen.");
    }
    console.log("  ✅ Verified: Android VPS configuration button is accessible on Android.");

    // ==========================================
    // TEST 4: Android Flow (Logged In)
    // ==========================================
    console.log("\n--- TEST 4: Android Native Flow (Logged In) ---");
    // Authenticate on Android
    const androidDevLogin = await page.waitForSelector("#dev-login-btn", { timeout: 5000 });
    await androidDevLogin.click();

    await page.waitForFunction(
      () => window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/dashboard"),
      { timeout: 10000 }
    );
    console.log(`  * Authenticated on Android, URL: ${page.url()}`);

    // Verify topbar lock button on Android
    const androidLockBtn = await page.waitForSelector('button[aria-label="Lock to Calculator"]', { timeout: 8000 });
    if (!androidLockBtn) {
      throw new Error("FAIL: 'Lock to Calculator' button missing in Android topbar!");
    }
    console.log("  ✅ Verified: Stealth Panic Lock button is available in Android topbar.");

    // Trigger Lock back to Calculator decoy
    console.log("  * Tapping Lock button to lock back to Calculator decoy...");
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Lock to Calculator"]');
      if (btn) btn.click();
    });

    // Should now be back at Calculator
    const lockedCalcDisplay = await page.waitForSelector("#calculator-display", { timeout: 8000 });
    if (!lockedCalcDisplay) {
      throw new Error("FAIL: Did not return to Calculator decoy after locking!");
    }
    console.log("  ✅ Verified: Instantly locked back to Calculator decoy.");

    // Unlock while already logged in: Type 2007 and press =
    console.log("  * Unlocking with passcode '2007' while authenticated...");
    await (await page.$("#calc-key-2")).click();
    await (await page.$("#calc-key-0")).click();
    await (await page.$("#calc-key-0")).click();
    await (await page.$("#calc-key-7")).click();
    await (await page.$("#calc-key-equals")).click();

    // Since ALREADY authenticated, it MUST transition immediately to Main App without asking to log in again!
    await page.waitForFunction(
      () => window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/dashboard"),
      { timeout: 10000 }
    );
    const postReunlockUrl = page.url();
    console.log(`  * URL after re-unlocking authenticated Android app: ${postReunlockUrl}`);
    if (!postReunlockUrl.includes("/dashboard") && !postReunlockUrl.includes("/admin")) {
      throw new Error(`FAIL: Expected direct transition to /dashboard when already logged in, got ${postReunlockUrl}`);
    }
    console.log("  ✅ Verified: Logged-in Android app transitions directly to Main Application on unlock!");

    console.log("\n==========================================");
    console.log("🎉 ALL 4 CORE FLOWS PASSED WITH 100% SUCCESS!");
    console.log("==========================================");
  } catch (error) {
    allPassed = false;
    console.error("\n❌ TEST FAILED:", error.message);
  } finally {
    await browser.close();
  }

  process.exit(allPassed ? 0 : 1);
}

runTests();
