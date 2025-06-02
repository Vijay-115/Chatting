const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const mediaDir = path.join(__dirname, '../media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir);
}

router.post('/upload', async (req, res) => {
  try {
    const { data, name } = req.body;

    if (!data || !name) {
      return res.status(400).json({ error: 'Missing base64 data or name' });
    }

    const filename = `${Date.now()}-${name}.txt`;
    const filePath = path.join(mediaDir, filename);

    // Save raw base64 string into a .txt file
    fs.writeFileSync(filePath, data, 'utf8');

    const relativePath = `/media/${filename}`;
    res.json({ filePath: relativePath });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to save base64 text' });
  }
});

module.exports = router;