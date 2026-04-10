const Imap = require('imap');
const { simpleParser } = require('mailparser');
const config = require('./config');

function extractOtp(text) {
  // Match 6-digit code
  const match = text.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

function waitForOtp(toAddress, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const imap = new Imap({
      user: config.imap.user,
      password: config.imap.pass,
      host: config.imap.host,
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    function poll() {
      if (Date.now() > deadline) {
        imap.end();
        return reject(new Error(`OTP timeout for ${toAddress}`));
      }

      imap.openBox('INBOX', false, (err, box) => {
        if (err) return reject(err);

        const since = new Date(Date.now() - 5 * 60 * 1000); // last 5 min
        imap.search(['UNSEEN', ['TO', toAddress], ['SINCE', since]], (err, uids) => {
          if (err) return reject(err);

          if (!uids || uids.length === 0) {
            setTimeout(() => {
              imap.closeBox(() => poll());
            }, 5000);
            return;
          }

          const fetch = imap.fetch(uids, { bodies: '' });
          fetch.on('message', msg => {
            msg.on('body', stream => {
              simpleParser(stream, (err, parsed) => {
                if (err) return;
                const text = parsed.text || parsed.html || '';
                const otp = extractOtp(text);
                if (otp) {
                  imap.end();
                  resolve(otp);
                }
              });
            });
          });
          fetch.once('error', reject);
        });
      });
    }

    imap.once('ready', poll);
    imap.once('error', reject);
    imap.connect();
  });
}

module.exports = { waitForOtp };
