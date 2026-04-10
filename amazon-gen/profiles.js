const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'profiles.csv');
let profiles = null;
let index = 0;

function load() {
  const lines = fs.readFileSync(CSV_PATH, 'utf8').trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  profiles = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]]));
  });
}

function next() {
  if (!profiles) load();
  if (index >= profiles.length) throw new Error('No more profiles in CSV');
  return profiles[index++];
}

module.exports = { next };
