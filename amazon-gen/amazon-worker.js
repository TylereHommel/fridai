const { chromium } = require('playwright');
const { waitForOtp } = require('./imap');
const output = require('./output');

async function runWorker(profile) {
  const {
    email, password, region, accountType, cvv,
    loginProxy, loginMethod
  } = profile;

  console.log(`[Worker] Starting: ${email}`);

  const launchOptions = { headless: false, slowMo: 50 };
  const contextOptions = {};

  if (loginProxy && loginProxy.trim()) {
    const [host, port, user, pass] = loginProxy.split(':');
    contextOptions.proxy = {
      server: `http://${host}:${port}`,
      ...(user && pass ? { username: user, password: pass } : {}),
    };
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  let twoFaKey = '';

  try {
    // Step 1: Navigate to Amazon signup
    await page.goto('https://www.amazon.com/ap/register', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await page.fill('input[name="customerName"]', email.split('@')[0]);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="passwordCheck"]', password);
    await page.click('input[id="continue"]');
    await page.waitForTimeout(3000);

    // Step 2: Email OTP
    console.log(`[Worker] Waiting for email OTP...`);
    const emailOtp = await waitForOtp(email);
    console.log(`[Worker] Email OTP: ${emailOtp}`);
    await page.fill('input[name="cvf_captcha_input"], input[name="code"]', emailOtp);
    await page.click('input[type="submit"], button[type="submit"]');
    await page.waitForTimeout(2500);

    // Step 3: 2FA setup
    await page.goto('https://www.amazon.com/a/settings/approval');
    await page.waitForTimeout(2000);

    const enableBtn = page.locator('button:has-text("Get started"), a:has-text("Get started")');
    if (await enableBtn.isVisible().catch(() => false)) {
      await enableBtn.click();
      await page.waitForTimeout(2000);

      const appOption = page.locator('input[value="auth_app"], label:has-text("Authenticator app")');
      await appOption.click().catch(() => {});

      await page.click('button:has-text("Can\'t scan the barcode")').catch(async () => {
        await page.click('a:has-text("Can\'t scan the barcode")').catch(() => {});
      });
      await page.waitForTimeout(1000);

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
