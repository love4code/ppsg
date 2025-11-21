const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  originalFilename: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  altText: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
  mimeType: {
    type: String,
    required: true,
  },
  sizes: {
    // New naming: thumbnail
    thumbnail: {
      data: Buffer,
      width: Number,
      height: Number,
    },
    // Legacy naming: small (for backward compatibility with old uploads)
    small: {
      data: Buffer,
      width: Number,
      height: Number,
    },
    medium: {
      data: Buffer,
      width: Number,
      height: Number,
    },
    large: {
      data: Buffer,
      width: Number,
      height: Number,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Media', mediaSchema);

