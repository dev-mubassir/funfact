const { del } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { passcode } = req.body;
  if (passcode !== '2424') {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing blob url' });
  }

  try {
    await del(url);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
};
