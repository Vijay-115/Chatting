const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

function authMiddleware(req, res, next) {
  // const token = req.headers.authorization?.split(' ')[1];
  // console.log('cookie',req.cookies);
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

router.get('/search', authMiddleware, async (req, res) => {
  const { query } = req.query;
  console.log('query',query)
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ message: 'Invalid or missing search query' });
  }

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { mobile: { $regex: query } },
      ],
    }).select('-password');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


router.post('/send-request', authMiddleware, async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.userId;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  if (!receiver || receiver.friendRequests.includes(senderId)) {
    return res.status(400).json({ message: 'Request already sent' });
  }

  receiver.friendRequests.push(senderId);
  sender.sentRequests.push(receiverId);

  await sender.save();
  await receiver.save();

  res.json({ message: 'Friend request sent' });
});

// GET /api/users/friend-requests
router.get('/friend-requests', authMiddleware, async (req, res) => {
  const receiver = await User.findById(req.user.userId)
    .populate('friendRequests', 'username mobile'); // populate sender info

  res.json(receiver.friendRequests);
});


router.post('/accept-request', authMiddleware, async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.user.userId;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);
  sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== receiverId);

  sender.friends.push(receiverId);
  receiver.friends.push(senderId);

  await sender.save();
  await receiver.save();

  res.json({ message: 'Friend request accepted' });
});

router.get('/friends', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId).populate('friends', 'username mobile');
  res.json(user.friends);
});

module.exports = router;