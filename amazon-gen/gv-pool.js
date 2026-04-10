const fs = require('fs');
const path = require('path');

const POOL_PATH = path.join(__dirname, 'gv-pool.json');

function load() {
  if (!fs.existsSync(POOL_PATH)) return [];
  return JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));
}

function save(pool) {
  fs.writeFileSync(POOL_PATH, JSON.stringify(pool, null, 2), 'utf8');
}

function add(entry) {
  const pool = load();
  pool.push({ ...entry, available: true });
  save(pool);
}

function lockOne() {
  const pool = load();
  const entry = pool.find(e => e.available);
  if (!entry) throw new Error('No available GV numbers in pool — run --setup to add more');
  entry.available = false;
  save(pool);
  return entry;
}

function release(gvNumber) {
  const pool = load();
  const entry = pool.find(e => e.gvNumber === gvNumber);
  if (entry) {
    entry.available = true;
    save(pool);
  }
}

function count() {
  return load().filter(e => e.available).length;
}

module.exports = { add, lockOne, release, count };
