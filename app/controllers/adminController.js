const Project = require('../models/Project');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Contact = require('../models/Contact');
const Media = require('../models/Media');

exports.dashboard = async (req, res) => {
  try {
    const stats = {
      projects: await Project.countDocuments(),
      publishedProjects: await Project.countDocuments({ status: 'published' }),
      products: await Product.countDocuments(),
      publishedProducts: await Product.countDocuments({ status: 'published' }),
      services: await Service.countDocuments(),
      publishedServices: await Service.countDocuments({ status: 'published' }),
      contacts: await Contact.countDocuments(),
      newContacts: await Contact.countDocuments({ status: 'new' }),
      media: await Media.countDocuments(),
    };

    const recentProjects = await Project.find()
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('admin/dashboard', {
      stats,
      recentProjects,
      recentContacts,
    });
  } catch (error) {
    req.session.error = 'Error loading dashboard';
    res.redirect('/admin/login');
  }
};

