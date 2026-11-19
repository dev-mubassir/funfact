const { list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { passcode } = req.body;
  if (passcode !== '2424') {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  try {
    const { blobs } = await list({ prefix: 'snap_' });

    const photos = blobs
      .map(b => ({
        name: b.pathname,
        url: b.url,
        date: b.uploadedAt,
        size: b.size
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ photos, count: photos.length });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: 'Failed to read photos' });
  }
};
