const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'profiles.csv');
let profiles = null;
let index = 0;

function load() {
  const lines = fs.readFileSync(CSV_PATH, 'utf8').trim().split('\n');
  const headers = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
  profiles = lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(';').map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
  });
}

function next() {
  if (!profiles) load();
  if (index >= profiles.length) throw new Error('No more profiles in CSV');
  const raw = profiles[index++];
  return {
    email: raw['email'] || '',
    password: raw['password'] || '',
    region: raw['region'] || 'US',
    twoFaKey: raw['2fa_authenticator_key'] || '',
    accountType: raw['account_type'] || '',
    cvv: raw['cvv'] || '',
    loginProxy: raw['login_proxy'] || '',
    loginMethod: raw['login_method'] || 'default',
  };
}

module.exports = { next };
