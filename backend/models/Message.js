const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    default: null
  },
  media: {
    type: String,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true // adds createdAt and updatedAt fields
});

// ✅ Ensure at least text or media is present
messageSchema.pre('validate', function (next) {
  if (!this.text && !this.media) {
    this.invalidate('text', 'Message must contain either text or media.');
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);