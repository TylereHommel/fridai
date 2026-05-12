const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());
const { waitForOtp } = require('./imap');
const { buyNumber, waitForSms, cancelOrder } = require('./smspool');
const config = require('./config');
const output = require('./output');

const FIRST_NAMES = [
  'James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles',
  'Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen',
  'Christopher','Daniel','Matthew','Anthony','Mark','Donald','Steven','Paul','Andrew','Joshua',
  'Ashley','Amanda','Melissa','Stephanie','Dorothy','Rebecca','Sharon','Laura','Cynthia','Amy',
  'Kevin','Brian','George','Edward','Ronald','Timothy','Jason','Jeffrey','Ryan','Jacob',
  'Emily','Nicole','Michelle','Samantha','Donna','Carol','Ruth','Sandra','Sharon','Lisa'
];

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts'
];

function randomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

// Random int between min and max inclusive
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Type text character by character with human-like delays and occasional mistakes
async function humanType(page, selector, text) {
  const el = page.locator(selector).first();
  await el.click();
  await sleep(rand(80, 200));

  for (const char of text) {
    // Occasionally mistype and correct (5% chance per char, only on letters)
    if (/[a-zA-Z]/.test(char) && Math.random() < 0.05) {
      const wrongChar = String.fromCharCode(char.charCodeAt(0) + rand(1, 2));
      await page.keyboard.type(wrongChar, { delay: rand(60, 140) });
      await sleep(rand(100, 300));
      await page.keyboard.press('Backspace');
      await sleep(rand(80, 180));
    }
    await page.keyboard.type(char, { delay: rand(60, 150) });
    // Brief pause every few characters
    if (Math.random() < 0.1) await sleep(rand(100, 400));
  }
}

// Move mouse in a curved arc from current position to target element before clicking
async function humanClick(page, selector) {
  const el = page.locator(selector).first();
  const box = await el.boundingBox();
  if (!box) {
    await el.click();
    return;
  }

  const targetX = box.x + box.width / 2 + rand(-5, 5);
  const targetY = box.y + box.height / 2 + rand(-3, 3);

  // Get current mouse position (start from a random point if unknown)
  const startX = rand(100, 900);
  const startY = rand(100, 600);

  // Move in steps along a slight curve
  const steps = rand(8, 16);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Add slight arc via quadratic easing
    const curveOffset = Math.sin(Math.PI * t) * rand(-20, 20);
    const x = startX + (targetX - startX) * t + curveOffset;
    const y = startY + (targetY - startY) * t + curveOffset * 0.4;
    await page.mouse.move(x, y);
    await sleep(rand(8, 25));
  }

  await page.mouse.move(targetX, targetY);
  await sleep(rand(50, 150));
  await page.mouse.click(targetX, targetY);
}

// Idle mouse drift — small random movements to simulate thinking
async function idleDrift(page, ms) {
  const end = Date.now() + ms;
  let x = rand(300, 700);
  let y = rand(200, 500);
  while (Date.now() < end) {
    x += rand(-30, 30);
    y += rand(-20, 20);
    x = Math.max(50, Math.min(1230, x));
    y = Math.max(50, Math.min(750, y));
    await page.mouse.move(x, y);
    await sleep(rand(80, 250));
  }
}

async function runWorker(profile) {
  const {
    email, password, region, accountType, cvv,
    loginProxy, loginMethod
  } = profile;

  console.log(`[Worker] Starting: ${email}`);

  const launchOptions = { headless: false };
  const contextOptions = {};

  if (loginProxy && loginProxy.trim()) {
    const [host, port, user, pass] = loginProxy.split(':');
    contextOptions.proxy = {
      server: `http://${host}:${port}`,
      ...(user && pass ? { username: user, password: pass } : {}),
    };
  }

  contextOptions.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  contextOptions.viewport = { width: 1280, height: 800 };
  contextOptions.locale = 'en-US';
  contextOptions.timezoneId = 'America/Los_Angeles';
  contextOptions.colorScheme = 'light';
  contextOptions.ignoreHTTPSErrors = true;
  contextOptions.extraHTTPHeaders = {
    'Accept-Language': 'en-US,en;q=0.9',
  };

  // Try system Chrome first (less detectable), fall back to bundled Chromium
  let browser;
  try {
    browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
  } catch {
    browser = await chromium.launch(launchOptions);
  }
  const context = await browser.newContext(contextOptions);

  const page = await context.newPage();

  let twoFaKey = '';

  // Browse terms to pick from during pre-warm search
  const SEARCH_TERMS = ['pokemon cards', 'trading cards', 'board games', 'card sleeves', 'card storage'];

  async function preWarm() {
    console.log(`[Worker] Pre-warming session...`);
    await page.goto('https://www.amazon.com', { waitUntil: 'domcontentloaded' });
    await sleep(rand(2000, 3500));
    await idleDrift(page, rand(2000, 3000));

    // Scroll down slowly like a real user reading the page
    for (let i = 0; i < rand(3, 6); i++) {
      await page.mouse.wheel(0, rand(200, 500));
      await sleep(rand(600, 1400));
    }
    await idleDrift(page, rand(1000, 2000));

    // Navigate to search results directly (avoids viewport issues with search bar)
    const term = SEARCH_TERMS[rand(0, SEARCH_TERMS.length - 1)];
    await page.goto(`https://www.amazon.com/s?k=${encodeURIComponent(term)}`, { waitUntil: 'domcontentloaded' });
    await sleep(rand(2000, 3500));

    // Scroll search results
    for (let i = 0; i < rand(3, 5); i++) {
      await page.mouse.wheel(0, rand(300, 600));
      await sleep(rand(600, 1300));
    }
    await idleDrift(page, rand(1000, 2000));

    // Click the first product result
    const firstResult = page.locator('[data-component-type="s-search-result"] h2 a').first();
    if (await firstResult.isVisible().catch(() => false)) {
      await firstResult.click();
      await sleep(rand(2000, 3500));
      // Scroll product page
      for (let i = 0; i < rand(2, 4); i++) {
        await page.mouse.wheel(0, rand(300, 700));
        await sleep(rand(600, 1400));
      }
      await idleDrift(page, rand(1000, 1800));
    }
    console.log(`[Worker] Pre-warm done`);
  }

  async function checkCaptcha() {
    const isCaptcha = await page.locator('h1').filter({ hasText: /puzzle|unusual activity|verify/i }).isVisible().catch(() => false);
    if (!isCaptcha) return;

    // Pause and wait for the user to solve it manually in the open browser window
    console.log(`\n[Worker] ⚠️  CAPTCHA detected for ${email}`);
    console.log(`[Worker] 👉 Solve the puzzle in the browser window, then press Confirm.`);
    console.log(`[Worker] Waiting for you to complete it...\n`);

    // Wait until the page navigates away from the CAPTCHA URL (up to 5 minutes)
    await page.waitForURL(url => !url.href.includes('/ap/cvf/request'), { timeout: 300000 });
    console.log(`[Worker] CAPTCHA solved — continuing...`);
    await sleep(1000);
  }

  try {
    // Step 0: Pre-warm session with real browsing before registering
    await preWarm();

    // Step 1: Navigate to sign-in page
    await page.goto('https://www.amazon.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2F&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=usflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await idleDrift(page, rand(800, 1500));

    // Type email with human cadence
    await humanType(page, 'input[name="email"]', email);
    await sleep(rand(300, 700));
    await humanClick(page, 'input[type="submit"]');
    await sleep(rand(1500, 2500));

    // "Looks like you're new to Amazon" — Proceed button
    await page.waitForSelector('input[type="submit"]', { timeout: 10000 });
    await idleDrift(page, rand(500, 1000));
    await humanClick(page, 'input[type="submit"]');

    // Registration form
    await page.waitForSelector('input[name="customerName"]', { timeout: 15000 });
    await idleDrift(page, rand(600, 1200));

    const fullName = randomName();
    console.log(`[Worker] Using name: ${fullName}`);
    await humanType(page, 'input[name="customerName"]', fullName);
    await sleep(rand(200, 500));

    // Email is pre-filled — click it, pause, move on
    await humanClick(page, 'input[name="email"]');
    await sleep(rand(300, 600));

    await humanType(page, 'input[name="password"]', password);
    await sleep(rand(400, 800));

    await humanType(page, 'input[name="passwordCheck"]', password);
    await sleep(rand(300, 700));

    // Drift before submitting
    await idleDrift(page, rand(400, 900));
    await humanClick(page, 'input[id="continue"]');
    await sleep(rand(2500, 4000));

    // Step 2: Check for CAPTCHA (with audio fallback)
    await checkCaptcha();

    // Step 2a: Email OTP (may not appear if phone is shown first)
    const emailOtpField = page.locator('input[name="cvf_captcha_input"]').or(page.locator('input[name="code"]'));
    const hasEmailOtp = await emailOtpField.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (hasEmailOtp) {
      console.log(`[Worker] Waiting for email OTP...`);
      const emailOtp = await waitForOtp(email);
      console.log(`[Worker] Email OTP: ${emailOtp}`);
      await idleDrift(page, rand(400, 800));
      await emailOtpField.first().click();
      await sleep(rand(200, 400));
      await page.keyboard.type(emailOtp, { delay: rand(80, 160) });
      await sleep(rand(400, 800));
      await humanClick(page, 'input[type="submit"]');
      await sleep(rand(2000, 3000));
    }

    // Step 2b: Phone verification
    const phoneInput = page.locator('input[name="phoneNumber"], input[type="tel"], input[name="mobileNumber"]').first();
    const hasPhone = await phoneInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasPhone) {
      console.log(`[Worker] Phone verification page detected`);

      // Check for a Skip / Not now / I'll do this later link first
      const skipLink = page.locator('a, button, span').filter({ hasText: /skip|not now|later|remind me|do this later/i }).first();
      const canSkip = await skipLink.isVisible({ timeout: 2000 }).catch(() => false);
      if (canSkip) {
        console.log(`[Worker] Skipping phone verification`);
        await skipLink.click();
        await sleep(rand(1500, 2500));
      } else {
        // Fall back to SMSPool
        if (!config.smsPoolKey) {
          console.log(`[Worker] No skip option and no smsPoolKey — pausing for manual phone entry`);
          console.log(`[Worker] Enter a phone number in the browser and complete verification, then wait...`);
          await page.waitForURL(u => !u.href.includes('ap/cvf') && !u.href.includes('ap/register'), { timeout: 300000 });
          await sleep(1000);
        } else {
          console.log(`[Worker] No skip option — buying SMSPool number...`);
          let orderId = null;
          try {
            const { number, orderId: oid } = await buyNumber(config.smsPoolKey);
            orderId = oid;
            console.log(`[Worker] SMSPool number: ${number} (order ${orderId})`);

            await phoneInput.click();
            await sleep(rand(300, 600));
            await page.keyboard.type(number, { delay: rand(80, 150) });
            await sleep(rand(500, 900));
            await humanClick(page, 'input[type="submit"]');
            await sleep(rand(2000, 3500));

            await page.waitForSelector('input[name="code"], input[name="cvf_captcha_input"]', { timeout: 15000 });
            console.log(`[Worker] Waiting for SMS code...`);
            const smsCode = await waitForSms(config.smsPoolKey, orderId);
            console.log(`[Worker] SMS code: ${smsCode}`);

            const smsField = page.locator('input[name="code"], input[name="cvf_captcha_input"]').first();
            await smsField.click();
            await sleep(rand(200, 400));
            await page.keyboard.type(smsCode, { delay: rand(80, 160) });
            await sleep(rand(400, 800));
            await humanClick(page, 'input[type="submit"]');
            await sleep(rand(2000, 3000));
          } catch (err) {
            if (orderId) await cancelOrder(config.smsPoolKey, orderId);
            throw err;
          }
        }
      }
    }

    // Step 3: 2FA setup
    await page.goto('https://www.amazon.com/a/settings/approval');
    await sleep(rand(1500, 2500));

    const enableBtn = page.locator('button:has-text("Get started"), a:has-text("Get started")');
    if (await enableBtn.isVisible().catch(() => false)) {
      await idleDrift(page, rand(500, 900));
      await enableBtn.click();
      await sleep(rand(1500, 2500));

      const appOption = page.locator('input[value="auth_app"], label:has-text("Authenticator app")');
      await appOption.click().catch(() => {});
      await sleep(rand(500, 1000));

      await page.click('button:has-text("Can\'t scan the barcode")').catch(async () => {
        await page.click('a:has-text("Can\'t scan the barcode")').catch(() => {});
      });
      await sleep(rand(800, 1500));

      const secretEl = page.locator('code, .auth-secret-key, [data-testid="secret-key"]');
      const raw = await secretEl.textContent().catch(() => '');
      twoFaKey = raw.replace(/\s/g, '').trim();
      console.log(`[Worker] 2FA secret: ${twoFaKey}`);
    }

    output.appendAccount({
      email,
      password,
      region: region || 'US',
      twoFaKey,
      accountType: accountType || '',
      cvv,
      loginProxy: loginProxy || '',
      loginMethod: loginMethod || 'default',
    });

    console.log(`[Worker] Complete: ${email}`);
  } catch (err) {
    console.error(`[Worker] Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = { runWorker };
