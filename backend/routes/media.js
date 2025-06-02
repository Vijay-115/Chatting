const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // adjust the path to your User model
const auth = require('../middleware/auth');

const router = express.Router();
const mongoose = require('mongoose');

router.post('/verify-media', auth, async (req, res) => {
    console.log('verify-media',req.body)
  const { password, data } = req.body;
  const userId = new mongoose.Types.ObjectId(req.user.userId);
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const filePath = path.join(__dirname, '..', data);

    const base64Data = fs.readFileSync(filePath, 'utf-8');
    const cleanedBase64 = base64Data.replace(/\d{13}/, ''); // removes timestamp

    res.json({ cleanedBase64 });
  } catch (err) {
    console.error('Media verify error:', err);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

module.exports = router;