const express = require('express');
const router = express.Router();

const homeController = require('../controllers/homeController');
const projectController = require('../controllers/projectController');
const productController = require('../controllers/productController');
const serviceController = require('../controllers/serviceController');
const contactController = require('../controllers/contactController');

// Home
router.get('/', homeController.index);

// Projects
router.get('/projects', projectController.publicIndex);
router.get('/projects/:slug', projectController.publicShow);

// Products
router.get('/products', productController.publicIndex);
router.get('/products/:slug', productController.publicShow);

// Services
router.get('/services', serviceController.publicIndex);
router.get('/services/:slug', serviceController.publicShow);

// Contact
router.get('/contact', (req, res) => {
  res.render('public/contact');
});
router.post('/contact', contactController.submit);

// About
router.get('/about', (req, res) => {
  res.render('public/about');
});

module.exports = router;

