const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: true,
  },
  mainImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  },
  gallery: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  location: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
  },
  tags: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Generate slug from title before saving
projectSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);

