const { chromium } = require('playwright');
const generators = require('./generators');
const smspool = require('./smspool');
const gvPool = require('./gv-pool');
const config = require('./config');

async function createGoogleAccount(page, email, password, firstName, lastName, phoneNumber) {
  await page.goto('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp');
  await page.fill('input[name="firstName"]', firstName);
  await page.fill('input[name="lastName"]', lastName);
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(2000);

  // Use custom email option
  await page.click('text=Use your existing email');
  await page.fill('input[type="email"]', email);
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(2000);

  // Birthday + gender (required)
  await page.selectOption('select#month', '6');
  await page.fill('input#day', '15');
  await page.fill('input#year', '1995');
  await page.selectOption('select#gender', '1');
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(2000);

  // Phone verification via SMSPool
  await page.fill('input[type="tel"]', phoneNumber);
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(3000);
}

async function claimGVNumber(page) {
  await page.goto('https://voice.google.com/u/0/signup');
  await page.waitForTimeout(3000);

  // Search for available number
  await page.fill('input[placeholder*="area code"]', '661');
  await page.waitForTimeout(2000);
  const firstResult = page.locator('.gv-number-selection-row').first();
  await firstResult.click();
  await page.click('button:has-text("Select")');
  await page.waitForTimeout(2000);

  // Get the claimed number
  const numberText = await page.locator('.gv-selected-number, [data-e2e="selected-number"]').textContent().catch(() => null);
  return numberText ? numberText.replace(/\D/g, '') : null;
}

async function enableSmsForwarding(page, forwardToEmail) {
  await page.goto('https://voice.google.com/u/0/settings');
  await page.waitForTimeout(2000);
  // Click Messages settings
  await page.click('text=Messages');
  await page.waitForTimeout(1000);
  // Enable email forwarding toggle if present
  const toggle = page.locator('text=Forward messages to email').locator('..').locator('input[type="checkbox"], [role="switch"]');
  const checked = await toggle.isChecked().catch(() => false);
  if (!checked) await toggle.click();
  await page.waitForTimeout(1000);
}

async function setupOne() {
  const { firstName, lastName } = generators.randomName();
  const gmailAddress = generators.randomGmailAddress();
  const password = generators.randomPassword();

  console.log(`\n[Setup] Creating Google account: ${gmailAddress}`);

  // Order SMSPool number for Google verification
  const { orderId, number } = await smspool.orderNumber('google');
  console.log(`[Setup] SMSPool number: ${number}`);

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await createGoogleAccount(page, gmailAddress, password, firstName, lastName, number);

    // Wait for and enter Google SMS OTP
    console.log('[Setup] Waiting for Google SMS OTP...');
    const otp = await smspool.waitForCode(orderId);
    console.log(`[Setup] Got OTP: ${otp}`);
    await page.fill('input[type="tel"], input#code', otp);
    await page.click('button:has-text("Next"), button:has-text("Verify")');
    await page.waitForTimeout(3000);

    // Set password
    await page.fill('input[name="Passwd"]', password).catch(() => {});
    await page.fill('input[name="PasswdAgain"]', password).catch(() => {});
    await page.click('button:has-text("Next")').catch(() => {});
    await page.waitForTimeout(3000);

    // Claim GV number
    console.log('[Setup] Claiming Google Voice number...');
    const gvNumber = await claimGVNumber(page);
    if (!gvNumber) throw new Error('Could not claim GV number');
    console.log(`[Setup] Claimed: +1${gvNumber}`);

    // Enable SMS forwarding to the Gmail we just created
    await enableSmsForwarding(page, gmailAddress);

    // Save to pool
    gvPool.add({
      gvNumber: `+1${gvNumber}`,
      gmailAddress,
      gmailPassword: password,
    });

    console.log(`[Setup] Done. Pool size: ${gvPool.count()}`);
  } finally {
    await browser.close();
  }
}

async function run() {
  const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  readline.question('How many GV numbers to create? ', async (n) => {
    readline.close();
    const count = parseInt(n) || 1;
    for (let i = 0; i < count; i++) {
      try {
        await setupOne();
      } catch (err) {
        console.error(`[Setup] Error on account ${i + 1}:`, err.message);
      }
    }
    console.log('\n[Setup] Complete.');
  });
}

module.exports = { run };
