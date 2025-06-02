const router = require('express').Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// ✅ FIRST: Define static route
router.get('/latest', auth, async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.userId);

  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { from: userId },
          { to: userId },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$from', userId] },
            '$to',
            '$from',
          ],
        },
        text: { $first: '$text' },
        createdAt: { $first: '$createdAt' },
        read: { $first: '$read' },
      },
    },
  ]);

  const latest = {};
  messages.forEach((msg) => {
    latest[msg._id] = msg;
  });

  res.json(latest);
});

// ✅ THEN define the dynamic route
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;

  // Optional: Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  const messages = await Message.find({
    $or: [
      { from: req.user.userId, to: id },
      { from: id, to: req.user.userId },
    ],
  }).sort('createdAt');
  res.json(messages);
});

// POST route
router.post('/read', auth, async (req, res) => {
  const { fromUserId } = req.body;
  await Message.updateMany(
    { from: fromUserId, to: req.user.userId, read: false },
    { $set: { read: true } }
  );
  res.sendStatus(200);
});

module.exports = router;
