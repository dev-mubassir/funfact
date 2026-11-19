const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = path.join(os.tmpdir(), 'funfact_snaps');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
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

  let deleted = 0;

  // Clear Vercel Blob if available
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list, del } = require('@vercel/blob');
      const { blobs } = await list({ prefix: 'snap_' });
      if (blobs.length > 0) {
        await del(blobs.map(b => b.url));
        deleted += blobs.length;
      }
    } catch (e) {}
  }

  // Clear tmp
  try {
    if (fs.existsSync(tmpDir)) {
      const files = fs.readdirSync(tmpDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
      files.forEach(f => {
        try { fs.unlinkSync(path.join(tmpDir, f)); deleted++; } catch (e) {}
      });
    }
  } catch (e) {}

  res.json({ success: true, deleted });
};
