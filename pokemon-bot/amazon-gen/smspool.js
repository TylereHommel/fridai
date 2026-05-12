const https = require('https');

function post(path, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const options = {
      hostname: 'api.smspool.net',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`SMSPool parse error: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path, params) {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams(params).toString();
    const options = {
      hostname: 'api.smspool.net',
      path: `${path}?${query}`,
      method: 'GET',
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`SMSPool parse error: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Buy a US number for Amazon verification
// Returns { number, orderId }
async function buyNumber(apiKey) {
  const res = await post('/purchase/sms', {
    key: apiKey,
    country: 'US',
    service: 'amazon',
    pool: 0,
  });
  if (!res.success) throw new Error(`SMSPool buy failed: ${JSON.stringify(res)}`);
  // Strip leading +1 or 1 — Amazon phone field takes 10-digit US number
  const number = String(res.number).replace(/^\+?1/, '').replace(/\D/g, '');
  return { number, orderId: String(res.order_id) };
}

// Poll for incoming SMS code — returns the OTP string
async function waitForSms(apiKey, orderId, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await get('/sms/history', { key: apiKey, orderid: orderId });
    const orders = Array.isArray(res) ? res : [res];
    for (const order of orders) {
      if (order.sms && order.sms !== '') return String(order.sms);
      if (order.code && order.code !== '') return String(order.code);
    }
  }
  throw new Error(`SMSPool timeout — no SMS received for order ${orderId}`);
}

// Cancel unused order
async function cancelOrder(apiKey, orderId) {
  await post('/cancel/sms', { key: apiKey, orderid: orderId }).catch(() => {});
}

module.exports = { buyNumber, waitForSms, cancelOrder };
