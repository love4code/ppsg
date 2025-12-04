const Settings = require('../models/Settings');

// Helper function to add timeout to promises
const withTimeout = (promise, timeoutMs = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ])
}

// Middleware to load settings and make them available to all views
const loadSettings = async (req, res, next) => {
  try {
    // Add timeout to prevent hanging queries
    const settings = await withTimeout(Settings.getSettings(), 5000);
    
    // Populate logo and ogImage if they exist (with timeout)
    if (settings.logo) {
      await withTimeout(settings.populate('logo'), 3000);
    }
    if (settings.ogImage) {
      await withTimeout(settings.populate('ogImage'), 3000);
    }
    
    res.locals.companySettings = settings.company || {};
    res.locals.socialMedia = settings.socialMedia || {};
    res.locals.siteSettings = settings;
    res.locals.siteLogo = settings.logo || null;
    res.locals.siteOgImage = settings.ogImage || null;
    next();
  } catch (error) {
    console.error('Error loading settings:', error.message);
    // Continue even if settings fail to load
    res.locals.companySettings = {};
    res.locals.socialMedia = {};
    res.locals.siteSettings = {};
    res.locals.siteLogo = null;
    res.locals.siteOgImage = null;
    next();
  }
};

module.exports = { loadSettings };

