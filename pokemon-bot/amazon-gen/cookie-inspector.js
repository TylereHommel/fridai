// Dumps Amazon cookies at each stage of the registration flow
// so we can compare what's present when CAPTCHA fires vs when it doesn't.
// Run: node amazon-gen/cookie-inspector.js

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
chromium.use(StealthPlugin());

const OUT = path.join(__dirname, 'cookie-snapshots');
fs.mkdirSync(OUT, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function snapshot(context, label) {
  const cookies = await context.cookies();
  const file = path.join(OUT, `${label}.json`);
  fs.writeFileSync(file, JSON.stringify(cookies, null, 2));
  const amz = cookies.filter(c => c.domain.includes('amazon'));
  const names = amz.map(c => c.name);
  const waf = amz.find(c => c.name === 'aws-waf-token');
  console.log(`[Snap] ${label}: ${names.join(', ') || '(none)'}`);
  if (waf) console.log(`       aws-waf-token: ${waf.value}`);
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  });
  const page = await context.newPage();

  // Stage 1: fresh amazon.com load
  await page.goto('https://www.amazon.com', { waitUntil: 'domcontentloaded' });
  await sleep(3000);
  await snapshot(context, '1-homepage');

  // Stage 2: search page
  await page.goto('https://www.amazon.com/s?k=pokemon+cards', { waitUntil: 'domcontentloaded' });
  await sleep(3000);
  await snapshot(context, '2-search');

  // Click first product
  const first = page.locator('[data-component-type="s-search-result"] h2 a').first();
  if (await first.isVisible().catch(() => false)) {
    await first.click();
    await sleep(3000);
    await snapshot(context, '3-product-page');
    await page.goBack();
    await sleep(1500);
  }

  // Stage 3: sign-in page
  await page.goto('https://www.amazon.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2F&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=usflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0', { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await snapshot(context, '4-signin-page');

  // Enter a test email
  const emailField = page.locator('input[name="email"]').first();
  await emailField.fill('cookietest99@tyscalpbot.com');
  await emailField.press('Enter');
  await sleep(2000);
  await snapshot(context, '5-after-email-submit');

  // Click proceed
  const submitBtn = page.locator('input[type="submit"]').first();
  if (await submitBtn.isVisible().catch(() => false)) {
    await submitBtn.click();
    await sleep(2000);
    await snapshot(context, '6-after-proceed');
  }

  // Fill registration form
  const nameField = page.locator('input[name="customerName"]').first();
  if (await nameField.isVisible({ timeout: 10000 }).catch(() => false)) {
    await nameField.fill('Marcus Webb');
    const pwField = page.locator('input[name="password"]').first();
    await pwField.fill('Duckduck1.');
    const pw2Field = page.locator('input[name="passwordCheck"]').first();
    await pw2Field.fill('Duckduck1.');
    await snapshot(context, '7-form-filled');
    await page.locator('input[id="continue"]').click();
    await sleep(3000);
    await snapshot(context, '8-after-form-submit');

    // Check if CAPTCHA fired
    const url = page.url();
    const title = await page.title();
    console.log(`\n[Result] URL: ${url}`);
    console.log(`[Result] Title: ${title}`);

    if (url.includes('cvf/request') || title.toLowerCase().includes('puzzle') || title.toLowerCase().includes('authentication')) {
      console.log('\n[CAPTCHA FIRED] — cookies saved to cookie-snapshots/8-after-form-submit.json');
      console.log('[ACTION] Solve the puzzle in the browser window. Script will capture cookies after you finish.\n');

      // Wait for user to solve it (up to 5 min)
      await page.waitForURL(u => !u.href.includes('/ap/cvf/request'), { timeout: 300000 });
      await sleep(1000);
      await snapshot(context, '9-after-captcha-solved');
      console.log('[Done] Cookies after CAPTCHA solve saved to cookie-snapshots/9-after-captcha-solved.json');
    } else {
      console.log('\n[NO CAPTCHA] — cookies at 8-after-form-submit.json are the clean set to replicate');
    }
  } else {
    console.log('[Error] Registration form did not appear');
    await snapshot(context, '8-unexpected-state');
  }

  // Give user time to inspect browser before it closes
  console.log('\nBrowser will close in 15 seconds...');
  await sleep(15000);
  await browser.close();
  console.log('\nAll snapshots saved to amazon-gen/cookie-snapshots/');
})();
