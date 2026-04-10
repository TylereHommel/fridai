const https = require('https');
const config = require('./config');

function request(endpoint) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.smspool.net${endpoint}&key=${config.smsPoolKey}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    }).on('error', reject);
  });
}

// Order a number for a given service (e.g. 'google' or 'amazon')
async function orderNumber(service) {
  // country 187 = United States
  const res = await request(`/purchase/sms/?country=187&service=${service}`);
  if (!res.order_id) throw new Error(`SMSPool order failed: ${JSON.stringify(res)}`);
  return { orderId: res.order_id, number: res.number };
}

// Poll for SMS code on an order
async function waitForCode(orderId, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await request(`/sms/check/?orderid=${orderId}`);
    if (res.sms && res.sms !== 'empty') return res.sms;
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`SMSPool timeout for order ${orderId}`);
}

// Cancel an order if unused
async function cancelOrder(orderId) {
  await request(`/sms/cancel/?orderid=${orderId}`);
}

module.exports = { orderNumber, waitForCode, cancelOrder };
