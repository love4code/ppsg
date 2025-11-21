const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Theme settings
  theme: {
    type: String,
    default: 'default',
    enum: ['default', 'ocean', 'sky', 'navy', 'royal', 'teal', 'custom'],
  },
  customColors: {
    primary: {
      type: String,
      default: '#0d6efd',
    },
    secondary: {
      type: String,
      default: '#6c757d',
    },
    success: {
      type: String,
      default: '#198754',
    },
    danger: {
      type: String,
      default: '#dc3545',
    },
    warning: {
      type: String,
      default: '#ffc107',
    },
    info: {
      type: String,
      default: '#0dcaf0',
    },
  },
  hero: {
    enabled: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: 'Welcome to PPSG',
    },
    subtitle: {
      type: String,
      default: 'Your trusted partner for quality services and exceptional results.',
    },
    buttonText: {
      type: String,
      default: 'Get in Touch',
    },
    buttonLink: {
      type: String,
      default: '/contact',
    },
    textColor: {
      type: String,
      default: '#ffffff',
    },
    backgroundImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
    },
    overlayOpacity: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    height: {
      type: String,
      default: 'medium',
      enum: ['small', 'medium', 'large', 'full'],
    },
  },
  company: {
    name: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    zipCode: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    copyright: {
      type: String,
      default: '',
    },
  },
  socialMedia: {
    facebook: {
      type: String,
      default: '',
    },
    twitter: {
      type: String,
      default: '',
    },
    instagram: {
      type: String,
      default: '',
    },
    linkedin: {
      type: String,
      default: '',
    },
    youtube: {
      type: String,
      default: '',
    },
    tiktok: {
      type: String,
      default: '',
    },
  },
}, {
  timestamps: true,
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);

