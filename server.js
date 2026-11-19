const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Ensure uploads directory exists (local dev)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));

// ===== API ROUTES =====

app.post('/api/snap', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image data' });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `snap_${Date.now()}.jpg`;

    // Try Vercel Blob first if token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = require('@vercel/blob');
        const blob = await put(filename, buffer, { access: 'public', contentType: 'image/jpeg' });
        console.log(`Blob snap saved: ${blob.url}`);
        return res.json({ success: true, url: blob.url });
      } catch (e) {
        console.error('Blob upload error, saving locally:', e);
      }
    }

    // Save locally
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    console.log(`Local snap saved: ${filename}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.post('/api/admin/photos', async (req, res) => {
  const passcode = (req.body && req.body.passcode) || req.query.passcode;
  if (passcode !== '2424') {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { list } = require('@vercel/blob');
        const { blobs } = await list({ prefix: 'snap_' });
        const photos = blobs.map(b => ({
          name: b.pathname, url: b.url,
          date: b.uploadedAt, size: b.size
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
        return res.json({ photos, count: photos.length, storage: 'blob' });
      } catch (e) {
        console.error('Blob list error:', e);
      }
    }

    const files = fs.readdirSync(uploadsDir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => {
        const stat = fs.statSync(path.join(uploadsDir, f));
        return { name: f, url: `/uploads/${f}`, date: stat.mtime.toISOString(), size: stat.size };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ photos: files, count: files.length, storage: 'local' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read photos' });
  }
});

app.delete('/api/admin/delete', async (req, res) => {
  const passcode = (req.body && req.body.passcode) || req.query.passcode;
  if (passcode !== '2424') return res.status(401).json({ error: 'Invalid passcode' });

  const url = req.query.url || (req.body && req.body.url);
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN && url.startsWith('http')) {
      const { del } = require('@vercel/blob');
      await del(url);
    } else {
      const filename = path.basename(url);
      const filepath = path.join(uploadsDir, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.post('/api/admin/clear', async (req, res) => {
  const passcode = (req.body && req.body.passcode) || req.query.passcode;
  if (passcode !== '2424') return res.status(401).json({ error: 'Invalid passcode' });

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { list, del } = require('@vercel/blob');
      const { blobs } = await list({ prefix: 'snap_' });
      if (blobs.length > 0) await del(blobs.map(b => b.url));
      res.json({ success: true, deleted: blobs.length });
    } else {
      const files = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
      files.forEach(f => fs.unlinkSync(path.join(uploadsDir, f)));
      res.json({ success: true, deleted: files.length });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear' });
  }
});

// Serve uploaded files locally
app.use('/uploads', express.static(uploadsDir));

app.listen(PORT, () => {
  console.log(`FunFact server running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin.html`);
});
