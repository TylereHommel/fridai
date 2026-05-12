module.exports = {
  concurrency: 5,
  proxyMode: 'direct', // 'direct' or 'proxy'
  imap: {
    host: 'imap.gmail.com',
    user: 'myfundedtraders1@gmail.com',
    pass: '', // Gmail app password — fill in before running
  },
  smsPoolKey: '', // SMSPool API key — fill in before running
  domains: [
    'tyscalpbot.com',
    'tyscalpbot.xyz',
    'asdfghjksa.xyz',
    'asdsws.xyz',
    'iuytrs.xyz',
    'qwertya.xyz',
    'rewqws.xyz',
  ],
  billing: {
    firstName: 'Tylere',
    lastName: 'Hommel',
    address: '43007 Lemonwood Dr',
    city: 'Lancaster',
    state: 'CA',
    zip: '93536',
  },
};
