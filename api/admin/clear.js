const { del } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { passcode } = req.body;
  if (passcode !== '2424') {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  try {
    const { list } = require('@vercel/blob');
    const { blobs } = await list({ prefix: 'snap_' });

    if (blobs.length > 0) {
      await del(blobs.map(b => b.url));
    }

    res.json({ success: true, deleted: blobs.length });
  } catch (err) {
    console.error('Clear error:', err);
    res.status(500).json({ error: 'Failed to clear photos' });
  }
};
