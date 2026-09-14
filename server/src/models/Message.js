const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, trim: true, default: '' },
  // Mixed keeps existing text-only messages compatible while allowing image,
  // video, GIF, sticker, and document attachments.
  media: { type: mongoose.Schema.Types.Mixed, default: [] },
  messageType: { type: String, enum: ['text', 'image', 'video', 'gif', 'sticker', 'document'], default: 'text' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
