const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'accounts.txt');

function appendAccount(account) {
  const {
    email, password, twoFactorSecret, gvNumber,
    cardLast4, shippingName, shippingAddress, createdAt
  } = account;

  const line = [
    email, password, twoFactorSecret, gvNumber,
    cardLast4, shippingName, shippingAddress, createdAt
  ].join('|') + '\n';

  fs.appendFileSync(OUTPUT_PATH, line, 'utf8');
  console.log(`[+] Saved: ${email}`);
}

module.exports = { appendAccount };
