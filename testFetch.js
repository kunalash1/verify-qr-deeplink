const fetch = require('node-fetch');
(async () => {
  try {
    const resp = await fetch('http://localhost:3002/generate-link', { method: 'POST' });
    const data = await resp.json();
    console.log('status:', resp.status, 'body:', data);
    if (data.deepLink) {
      const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(data.deepLink)}`;
      console.log('QR URL', qrUrl);
    }
  } catch (e) {
    console.error(e);
  }
})();
