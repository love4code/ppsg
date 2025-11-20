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
  mimeType: {
    type: String,
    required: true,
  },
  sizes: {
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

