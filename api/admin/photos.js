const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = path.join(os.tmpdir(), 'funfact_snaps');
if (!fs.existsSync(tmpDir)) {
  try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
}

module.exports = async function handler(req, res) {
  // Parse body safely
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const passcode = (body && body.passcode) || req.query.passcode;

  if (passcode !== '2424') {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  // 1. Try Vercel Blob Storage first if token exists
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = require('@vercel/blob');
      const { blobs } = await list({ prefix: 'snap_' });

      const photos = blobs
        .map(b => ({
          name: b.pathname,
          url: b.url,
          date: b.uploadedAt,
          size: b.size
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.json({ photos, count: photos.length, storage: 'blob' });
    } catch (err) {
      console.error('Blob list error:', err);
    }
  }

  // 2. Fallback to /tmp storage (works without any env variables!)
  try {
    let files = [];
    if (fs.existsSync(tmpDir)) {
      files = fs.readdirSync(tmpDir)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .map(f => {
          const filePath = path.join(tmpDir, f);
          const stat = fs.statSync(filePath);
          const base64 = fs.readFileSync(filePath, 'base64');
          return {
            name: f,
            url: `data:image/jpeg;base64,${base64}`,
            date: stat.mtime.toISOString(),
            size: stat.size
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return res.json({
      photos: files,
      count: files.length,
      storage: 'tmp',
      needsBlob: !process.env.BLOB_READ_WRITE_TOKEN
    });
  } catch (err) {
    console.error('Tmp read error:', err);
    return res.json({ photos: [], count: 0, storage: 'none' });
  }
};
