const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'accounts.txt');

function appendAccount(account) {
  const {
    email, password, region, twoFaKey,
    accountType, cvv, loginProxy, loginMethod
  } = account;

  const line = [
    email, password, region, twoFaKey,
    accountType, cvv, loginProxy, loginMethod
  ].join(';') + '\n';

  fs.appendFileSync(OUTPUT_PATH, line, 'utf8');
  console.log(`[+] Saved: ${email}`);
}

module.exports = { appendAccount };
