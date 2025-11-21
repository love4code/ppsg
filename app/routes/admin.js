const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { setAdminLayout } = require('../middleware/layout');
const upload = require('../middleware/upload');

// Set admin layout for all admin routes
router.use(setAdminLayout);

const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const mediaController = require('../controllers/mediaController');
const projectController = require('../controllers/projectController');
const productController = require('../controllers/productController');
const serviceController = require('../controllers/serviceController');
const contactController = require('../controllers/contactController');
const settingsController = require('../controllers/settingsController');

// Auth routes (no auth required)
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// All admin routes require authentication
router.use(requireAuth);

// Dashboard
router.get('/', adminController.dashboard);

// Media routes
router.get('/media', mediaController.index);
router.get('/media/:id', mediaController.show);
router.get('/media/:id/edit', mediaController.edit);
router.put('/media/:id', mediaController.update);
router.post('/media/upload', upload.array('files', 10), mediaController.upload);
router.post('/media/upload-single', upload.single('files'), mediaController.upload);
router.delete('/media/:id', mediaController.delete);
router.get('/media/image/:id/:size', mediaController.getImage);
router.get('/api/media', mediaController.getAll);

// Project routes
router.get('/projects', projectController.index);
router.get('/projects/create', projectController.create);
router.post('/projects', projectController.store);
router.get('/projects/:id', projectController.show);
router.get('/projects/:id/edit', projectController.edit);
router.put('/projects/:id', projectController.update);
router.delete('/projects/:id', projectController.delete);

// Product routes
router.get('/products', productController.index);
router.get('/products/create', productController.create);
router.post('/products', productController.store);
router.get('/products/:id', productController.show);
router.get('/products/:id/edit', productController.edit);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.delete);

// Service routes
router.get('/services', serviceController.index);
router.get('/services/create', serviceController.create);
router.post('/services', serviceController.store);
router.get('/services/:id', serviceController.show);
router.get('/services/:id/edit', serviceController.edit);
router.put('/services/:id', serviceController.update);
router.delete('/services/:id', serviceController.delete);

// Contact routes
router.get('/contacts', contactController.index);
router.get('/contacts/:id', contactController.show);
router.put('/contacts/:id/status', contactController.updateStatus);
router.delete('/contacts/:id', contactController.delete);

// Settings routes
router.get('/settings', settingsController.index);
router.post('/settings', settingsController.update);
router.put('/settings', settingsController.update);
router.get('/api/theme.css', settingsController.getThemeCSS);

module.exports = router;

