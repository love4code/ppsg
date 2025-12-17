const Project = require('../models/Project')
const Product = require('../models/Product')
const Service = require('../models/Service')
const Settings = require('../models/Settings')
const mongoose = require('mongoose')
const { ensureDatabaseConnected } = require('../middleware/dbCheck')

exports.index = async (req, res) => {
  try {
    // Check database connection before queries
    // If not connected, we'll just show empty arrays
    const mongoose = require('mongoose')
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️  Database not connected, showing empty home page')
      return res.render('public/home', {
        featuredProjects: [],
        featuredServices: [],
        featuredProducts: [],
        heroSettings: {}
      })
    }

    const featuredProjects = await Project.find({
      status: 'published',
      featured: true
    })
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()

    const featuredServices = await Service.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()

    const featuredProducts = await Product.find({
      status: 'published',
      featured: true
    })
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()

    const settings = await Settings.getSettings()
    let heroSettings = settings.hero || {}

    // Populate background image if it exists
    if (heroSettings && heroSettings.backgroundImage) {
      await settings.populate('hero.backgroundImage')
      heroSettings = settings.hero || {}
    }

    // Log if no data found (for debugging)
    if (
      featuredProjects.length === 0 &&
      featuredServices.length === 0 &&
      featuredProducts.length === 0
    ) {
      console.warn('⚠️  Home page: No published content found in database')
      console.warn(
        '⚠️  Check if database is seeded and items have status: "published"'
      )
    }

    res.render('public/home', {
      featuredProjects: featuredProjects || [],
      featuredServices: featuredServices || [],
      featuredProducts: featuredProducts || [],
      heroSettings: heroSettings
    })
  } catch (error) {
    console.error('❌ Home page error:', error.message)
    console.error('❌ Error code:', error.code || 'UNKNOWN')
    console.error('❌ Error stack:', error.stack)

    // Log database connection state
    const dbState = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    console.error(`❌ Database state: ${states[dbState]} (${dbState})`)

    // Still render the page with empty arrays so the site doesn't crash
    res.render('public/home', {
      featuredProjects: [],
      featuredServices: [],
      featuredProducts: [],
      heroSettings: {}
    })
  }
}
