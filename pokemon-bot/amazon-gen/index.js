const args = process.argv.slice(2);
const config = require('./config');

if (args.includes('--setup')) {
  require('./google-setup').run();
} else if (args.includes('--gen')) {
  const concurrency = (() => {
    const i = args.indexOf('--concurrency');
    return i !== -1 ? (parseInt(args[i + 1]) || config.concurrency) : config.concurrency;
  })();
  require('./gen-runner').run(concurrency);
} else {
  console.log('Usage: node amazon-gen/index.js --setup | --gen [--concurrency N]');
}
