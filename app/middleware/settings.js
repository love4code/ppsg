const Settings = require('../models/Settings')
const mongoose = require('mongoose')

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
  // Check if database is connected before attempting queries
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️  Database not connected, skipping settings load')
    // Set default values and continue
    res.locals.companySettings = {}
    res.locals.socialMedia = {}
    res.locals.siteSettings = {}
    res.locals.siteLogo = null
    res.locals.siteOgImage = null
    return next()
  }

  try {
    // Add timeout to prevent hanging queries
    const settings = await withTimeout(Settings.getSettings(), 5000)

    // Populate logo and ogImage if they exist (with timeout)
    if (settings && settings.logo) {
      try {
        await withTimeout(settings.populate('logo'), 3000)
      } catch (populateError) {
        console.warn('⚠️  Failed to populate logo:', populateError.message)
      }
    }
    if (settings && settings.ogImage) {
      try {
        await withTimeout(settings.populate('ogImage'), 3000)
      } catch (populateError) {
        console.warn('⚠️  Failed to populate ogImage:', populateError.message)
      }
    }

    res.locals.companySettings = settings?.company || {}
    res.locals.socialMedia = settings?.socialMedia || {}
    res.locals.siteSettings = settings || {}
    res.locals.siteLogo = settings?.logo || null
    res.locals.siteOgImage = settings?.ogImage || null
    next()
  } catch (error) {
    console.error('❌ Error loading settings:', error.message)
    console.error('❌ Error code:', error.code || 'UNKNOWN')
    // Continue even if settings fail to load - don't break the site
    res.locals.companySettings = {}
    res.locals.socialMedia = {}
    res.locals.siteSettings = {}
    res.locals.siteLogo = null
    res.locals.siteOgImage = null
    next() // Always call next() to continue request processing
  }
}

module.exports = { loadSettings }
