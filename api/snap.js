const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = path.join(os.tmpdir(), 'funfact_snaps');
if (!fs.existsSync(tmpDir)) {
  try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const image = body && body.image;
    if (!image) {
      return res.status(400).json({ error: 'No image data' });
    }

    // Strip data URL prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `snap_${Date.now()}.jpg`;

    // 1. If Vercel Blob token is available, use Blob storage
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = require('@vercel/blob');
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: 'image/jpeg',
        });
        console.log(`Blob saved: ${blob.url}`);
        return res.json({ success: true, url: blob.url });
      } catch (blobErr) {
        console.error('Blob upload error, falling back to tmp:', blobErr);
      }
    }

    // 2. Fallback to /tmp storage (works without any env vars!)
    fs.writeFileSync(path.join(tmpDir, filename), buffer);
    console.log(`Tmp snap saved: ${filename}`);
    return res.json({ success: true, storage: 'tmp' });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to save photo' });
  }
};
