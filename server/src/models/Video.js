const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  url: { type: String, required: true },
  mimeType: { type: String, required: true, default: 'video/mp4' },
  qualityLabel: { type: String, default: 'HD' },
  isHighDefinition: { type: Boolean, default: true },
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 },
  durationSeconds: { type: Number, default: 0 },
  sizeBytes: { type: Number, default: 0 },
  thumbnail: { type: String, default: '' },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);
