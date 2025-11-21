const Project = require('../models/Project');
const Media = require('../models/Media');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const statusFilter = req.query.status || '';

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }
    if (statusFilter) {
      query.status = statusFilter;
    }

    const projects = await Project.find(query)
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.render('admin/projects/index', {
      projects,
      currentPage: page,
      totalPages,
      search,
      statusFilter,
    });
  } catch (error) {
    req.session.error = 'Error loading projects';
    res.redirect('/admin');
  }
};

exports.show = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(['mainImage', 'gallery']);
    if (!project) {
      req.session.error = 'Project not found';
      return res.redirect('/admin/projects');
    }
    const media = await Media.find().sort({ createdAt: -1 }).limit(50);
    res.render('admin/projects/show', { project, media });
  } catch (error) {
    req.session.error = 'Error loading project';
    res.redirect('/admin/projects');
  }
};

exports.create = async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 }).limit(50);
    res.render('admin/projects/create', { media });
  } catch (error) {
    req.session.error = 'Error loading form';
    res.redirect('/admin/projects');
  }
};

exports.store = async (req, res) => {
  try {
    const { title, description, mainImage, gallery, status, location, date, tags, metaTitle, metaDescription, keywords, ogImage } = req.body;
    
    // Handle gallery - can be array, comma-separated string, or single value
    let galleryArray = [];
    if (gallery) {
      if (Array.isArray(gallery)) {
        galleryArray = gallery.filter(id => id && id.trim());
      } else if (typeof gallery === 'string' && gallery.includes(',')) {
        galleryArray = gallery.split(',').map(id => id.trim()).filter(id => id);
      } else if (gallery.trim()) {
        galleryArray = [gallery.trim()];
      }
    }
    
    // Handle keywords - parse from comma-separated string
    let keywordsArray = [];
    if (keywords && typeof keywords === 'string') {
      keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
    }
    
    const project = new Project({
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description,
      mainImage: mainImage || undefined,
      gallery: galleryArray,
      status: status || 'draft',
      location: location || '',
      date: date || undefined,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      metaTitle: metaTitle ? metaTitle.trim() : undefined,
      metaDescription: metaDescription ? metaDescription.trim() : undefined,
      keywords: keywordsArray,
      ogImage: ogImage || undefined,
    });

    await project.save();
    req.session.success = 'Project created successfully';
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Create project error:', error);
    req.session.error = 'Error creating project';
    res.redirect('/admin/projects/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(['mainImage', 'gallery', 'ogImage']);
    if (!project) {
      req.session.error = 'Project not found';
      return res.redirect('/admin/projects');
    }
    const media = await Media.find().sort({ createdAt: -1 }).limit(50);
    res.render('admin/projects/edit', { project, media });
  } catch (error) {
    req.session.error = 'Error loading project';
    res.redirect('/admin/projects');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description, mainImage, gallery, status, location, date, tags, metaTitle, metaDescription, keywords, ogImage } = req.body;
    
    // Handle gallery - can be array, comma-separated string, or single value
    let galleryArray = [];
    if (gallery) {
      if (Array.isArray(gallery)) {
        galleryArray = gallery.filter(id => id && id.trim());
      } else if (typeof gallery === 'string' && gallery.includes(',')) {
        galleryArray = gallery.split(',').map(id => id.trim()).filter(id => id);
      } else if (gallery.trim()) {
        galleryArray = [gallery.trim()];
      }
    }
    
    // Handle keywords - parse from comma-separated string
    let keywordsArray = [];
    if (keywords && typeof keywords === 'string') {
      keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        mainImage: mainImage || undefined,
        gallery: galleryArray,
        status: status || 'draft',
        location: location || '',
        date: date || undefined,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        metaTitle: metaTitle ? metaTitle.trim() : null,
        metaDescription: metaDescription ? metaDescription.trim() : null,
        keywords: keywordsArray,
        ogImage: ogImage || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      req.session.error = 'Project not found';
      return res.redirect('/admin/projects');
    }

    req.session.success = 'Project updated successfully';
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Update project error:', error);
    req.session.error = 'Error updating project';
    res.redirect(`/admin/projects/${req.params.id}/edit`);
  }
};

exports.delete = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    req.session.success = 'Project deleted successfully';
    res.redirect('/admin/projects');
  } catch (error) {
    req.session.error = 'Error deleting project';
    res.redirect('/admin/projects');
  }
};

// Public routes
exports.publicIndex = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const projects = await Project.find({ status: 'published' })
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments({ status: 'published' });
    const totalPages = Math.ceil(total / limit);

    res.render('public/projects/index', {
      projects,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    req.session.error = 'Error loading projects';
    res.redirect('/');
  }
};

exports.publicShow = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, status: 'published' })
      .populate(['mainImage', 'gallery', 'ogImage']);
    
    if (!project) {
      return res.status(404).render('errors/404');
    }

    // Prepare SEO data
    const ogImageObj = project.ogImage || project.mainImage;
    const ogImageUrl = ogImageObj && ogImageObj._id 
      ? `${req.protocol}://${req.get('host')}/admin/media/image/${ogImageObj._id}/large`
      : null;
    
    const seoData = {
      title: project.metaTitle || project.title,
      description: project.metaDescription || project.description || '',
      keywords: project.keywords && project.keywords.length > 0 ? project.keywords.join(', ') : '',
      ogImage: ogImageUrl,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    };

    res.render('public/projects/show', { project, seoData });
  } catch (error) {
    res.status(500).render('errors/500', { error });
  }
};

