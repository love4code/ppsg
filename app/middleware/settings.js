const Settings = require('../models/Settings');

// Middleware to load settings and make them available to all views
const loadSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    
    // Populate logo if it exists
    if (settings.logo) {
      await settings.populate('logo');
    }
    
    res.locals.companySettings = settings.company || {};
    res.locals.socialMedia = settings.socialMedia || {};
    res.locals.siteSettings = settings;
    res.locals.siteLogo = settings.logo || null;
    next();
  } catch (error) {
    console.error('Error loading settings:', error);
    // Continue even if settings fail to load
    res.locals.companySettings = {};
    res.locals.socialMedia = {};
    res.locals.siteSettings = {};
    res.locals.siteLogo = null;
    next();
  }
};

module.exports = { loadSettings };

