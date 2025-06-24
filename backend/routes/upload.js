// routes/upload.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const mediaDir = path.join(__dirname, '../media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir);
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const filename = `${Date.now()}-${file.originalname}.txt`;
    const filePath = path.join(mediaDir, filename);

    fs.writeFileSync(filePath, base64Data, 'utf8');

    const relativePath = `/media/${filename}`;
    res.json({ filePath: relativePath });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;
