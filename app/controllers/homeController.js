const Project = require('../models/Project');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Settings = require('../models/Settings');

exports.index = async (req, res) => {
  try {
    const featuredProjects = await Project.find({ status: 'published' })
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const featuredServices = await Service.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const featuredProducts = await Product.find({ status: 'published' })
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const settings = await Settings.getSettings();
    let heroSettings = settings.hero || {};
    
    // Populate background image if it exists
    if (heroSettings && heroSettings.backgroundImage) {
      await settings.populate('hero.backgroundImage');
      heroSettings = settings.hero || {};
    }

    res.render('public/home', {
      featuredProjects: featuredProjects || [],
      featuredServices: featuredServices || [],
      featuredProducts: featuredProducts || [],
      heroSettings: heroSettings,
    });
  } catch (error) {
    console.error('Home page error:', error);
    console.error('Error stack:', error.stack);
    // Still render the page with empty arrays so the site doesn't crash
    res.render('public/home', {
      featuredProjects: [],
      featuredServices: [],
      featuredProducts: [],
      heroSettings: {},
    });
  }
};

