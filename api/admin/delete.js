const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = path.join(os.tmpdir(), 'funfact_snaps');

module.exports = async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const passcode = (body && body.passcode) || req.query.passcode;

  if (passcode !== '2424') {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  const url = req.query.url || (body && body.url);
  if (!url) {
    return res.status(400).json({ error: 'Missing photo url' });
  }

  if (process.env.BLOB_READ_WRITE_TOKEN && url.startsWith('http')) {
    try {
      const { del } = require('@vercel/blob');
      await del(url);
      return res.json({ success: true });
    } catch (e) {}
  }

  // Delete from tmp
  try {
    const filename = req.query.name || path.basename(url);
    const filepath = path.join(tmpDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (e) {}

  res.json({ success: true });
};
