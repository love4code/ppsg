const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
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
    default: '',
  },
  price: {
    type: Number,
    min: 0,
  },
  startingAtPrice: {
    type: Number,
    min: 0,
  },
  manufacturer: {
    type: String,
    trim: true,
  },
  materials: {
    type: String,
    trim: true,
  },
  saltwaterCompatible: {
    type: Boolean,
    default: false,
  },
  sizes: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
  }],
  isTaxable: {
    type: Boolean,
    default: true,
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
  featured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Generate slug from name before saving
productSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

