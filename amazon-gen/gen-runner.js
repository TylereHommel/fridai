const { runWorker } = require('./amazon-worker');
const profiles = require('./profiles');

async function run() {
  let profile;
  let count = 0;

  try {
    while (true) {
      try {
        profile = profiles.next();
      } catch (e) {
        console.log(`[Gen] All profiles processed (${count} accounts created).`);
        break;
      }

      await runWorker(profile);
      count++;
    }
  } catch (err) {
    console.error('[Gen] Fatal error:', err.message);
  }
}

module.exports = { run };
