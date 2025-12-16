const express = require('express')
const router = express.Router()

const { requireAuth } = require('../middleware/auth')
const { setAdminLayout } = require('../middleware/layout')
const upload = require('../middleware/upload')

// Set admin layout for all admin routes
router.use(setAdminLayout)

const authController = require('../controllers/authController')
const adminController = require('../controllers/adminController')
const mediaController = require('../controllers/mediaController')
const projectController = require('../controllers/projectController')
const productController = require('../controllers/productController')
const serviceController = require('../controllers/serviceController')
const contactController = require('../controllers/contactController')
const customerController = require('../controllers/customerController')
const saleController = require('../controllers/saleController')
const settingsController = require('../controllers/settingsController')

// Auth routes (no auth required)
router.get('/login', authController.showLogin)
router.post('/login', authController.login)
router.post('/logout', authController.logout)

// All admin routes require authentication
router.use(requireAuth)

// Dashboard
router.get('/', adminController.dashboard)

// Media routes
router.get('/media', mediaController.index)
router.get('/media/:id', mediaController.show)
router.get('/media/:id/edit', mediaController.edit)
router.put('/media/:id', mediaController.update)
router.post('/media/upload', upload.array('files', 10), mediaController.upload)
router.post(
  '/media/upload-single',
  upload.single('files'),
  mediaController.upload
)
router.delete('/media/:id', mediaController.delete)
// Note: Image route moved to public routes so images can be accessed without authentication
router.get('/api/media', mediaController.getAll)

// Project routes
router.get('/projects', projectController.index)
router.get('/projects/create', projectController.create)
router.post('/projects', projectController.store)
router.get('/projects/:id', projectController.show)
router.get('/projects/:id/edit', projectController.edit)
router.put('/projects/:id', projectController.update)
router.delete('/projects/:id', projectController.delete)

// Product routes
router.get('/products', productController.index)
router.get('/products/create', productController.create)
router.post('/products', productController.store)
router.get('/products/:id', productController.show)
router.get('/products/:id/edit', productController.edit)
router.put('/products/:id', productController.update)
router.delete('/products/:id', productController.delete)

// Service routes
router.get('/services', serviceController.index)
router.get('/services/create', serviceController.create)
router.post('/services', serviceController.store)
router.get('/services/:id', serviceController.show)
router.get('/services/:id/edit', serviceController.edit)
router.put('/services/:id', serviceController.update)
router.delete('/services/:id', serviceController.delete)

// Contact routes
router.get('/contacts', contactController.index)
router.get('/contacts/:id', contactController.show)
router.put('/contacts/:id/status', contactController.updateStatus)
router.delete('/contacts/:id', contactController.delete)

// Customer routes
router.get('/customers', customerController.index)
router.get('/customers/new', customerController.create)
router.post('/customers', customerController.store)
router.get('/customers/:id', customerController.show)
router.get('/customers/:id/edit', customerController.edit)
router.put('/customers/:id', customerController.update)
router.delete('/customers/:id', customerController.delete)

// Sale routes
router.get('/sales', saleController.index)
router.get('/sales/new', saleController.create)
router.get('/customers/:customerId/sales/new', saleController.create)
router.post('/sales', saleController.store)
router.post('/customers/:customerId/sales', saleController.store)
router.get('/sales/:id', saleController.show)
router.get('/sales/:id/edit', saleController.edit)
router.put('/sales/:id', saleController.update)
router.delete('/sales/:id', saleController.delete)

// Product API routes
router.get('/api/products', productController.search)

// Settings routes
router.get('/settings', settingsController.index)
router.post('/settings', settingsController.update)
router.put('/settings', settingsController.update)
router.get('/api/theme.css', settingsController.getThemeCSS)

// Diagnostic route (for debugging database issues)
router.get('/diagnostics', async (req, res) => {
  const mongoose = require('mongoose')
  const Product = require('../models/Product')
  const Project = require('../models/Project')
  const Service = require('../models/Service')
  const Settings = require('../models/Settings')

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connectionState: mongoose.connection.readyState,
      connectionStateName: [
        'disconnected',
        'connected',
        'connecting',
        'disconnecting'
      ][mongoose.connection.readyState],
      databaseName: mongoose.connection.db
        ? mongoose.connection.db.databaseName
        : 'N/A',
      host: mongoose.connection.host || 'N/A',
      port: mongoose.connection.port || 'N/A',
      mongodbUriSet: !!process.env.MONGODB_URI,
      mongodbUriMasked: process.env.MONGODB_URI
        ? process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
        : 'NOT SET'
    },
    data: {
      products: { total: 0, published: 0 },
      projects: { total: 0, published: 0 },
      services: { total: 0, published: 0 },
      settings: { exists: false }
    },
    errors: []
  }

  try {
    if (mongoose.connection.readyState === 1) {
      // Test queries
      diagnostics.data.products.total = await Product.countDocuments({})
      diagnostics.data.products.published = await Product.countDocuments({
        status: 'published'
      })

      diagnostics.data.projects.total = await Project.countDocuments({})
      diagnostics.data.projects.published = await Project.countDocuments({
        status: 'published'
      })

      diagnostics.data.services.total = await Service.countDocuments({})
      diagnostics.data.services.published = await Service.countDocuments({
        status: 'published'
      })

      const settings = await Settings.findOne()
      diagnostics.data.settings.exists = !!settings
    } else {
      diagnostics.errors.push(
        'Database is not connected. Connection state: ' +
          diagnostics.database.connectionStateName
      )
    }
  } catch (error) {
    diagnostics.errors.push('Error running diagnostics: ' + error.message)
  }

  res.json(diagnostics)
})

module.exports = router
