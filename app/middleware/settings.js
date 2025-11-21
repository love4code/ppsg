const Settings = require('../models/Settings');

// Middleware to load settings and make them available to all views
const loadSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.locals.companySettings = settings.company || {};
    res.locals.siteSettings = settings;
    next();
  } catch (error) {
    console.error('Error loading settings:', error);
    // Continue even if settings fail to load
    res.locals.companySettings = {};
    res.locals.siteSettings = {};
    next();
  }
};

module.exports = { loadSettings };

