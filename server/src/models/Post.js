const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  mimeType: { type: String, required: true, trim: true },
  fileName: { type: String, default: '', trim: true },
  sizeBytes: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  durationSeconds: { type: Number, default: 0 },
  thumbnailUrl: { type: String, default: '', trim: true },
  qualityLabel: { type: String, default: 'HD', trim: true },
  isHighDefinition: { type: Boolean, default: true }
}, { _id: false });

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, trim: true },
  media: [mediaSchema],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  isStory: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
