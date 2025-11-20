const Product = require('../models/Product');
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
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }
    if (statusFilter) {
      query.status = statusFilter;
    }

    const products = await Product.find(query)
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.render('admin/products/index', {
      products,
      currentPage: page,
      totalPages,
      search,
      statusFilter,
    });
  } catch (error) {
    req.session.error = 'Error loading products';
    res.redirect('/admin');
  }
};

exports.show = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(['mainImage', 'gallery']);
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }
    const media = await Media.find().sort({ createdAt: -1 }).limit(50);
    res.render('admin/products/show', { product, media });
  } catch (error) {
    req.session.error = 'Error loading product';
    res.redirect('/admin/products');
  }
};

exports.create = async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 }).limit(50);
    res.render('admin/products/create', { media });
  } catch (error) {
    req.session.error = 'Error loading form';
    res.redirect('/admin/products');
  }
};

exports.store = async (req, res) => {
  try {
    const { name, description, price, isTaxable, mainImage, gallery, status } = req.body;
    
    const galleryArray = Array.isArray(gallery) ? gallery : gallery ? [gallery] : [];
    
    const product = new Product({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description,
      price: parseFloat(price),
      isTaxable: isTaxable === 'on' || isTaxable === true,
      mainImage: mainImage || undefined,
      gallery: galleryArray,
      status: status || 'draft',
    });

    await product.save();
    req.session.success = 'Product created successfully';
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Create product error:', error);
    req.session.error = 'Error creating product';
    res.redirect('/admin/products/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(['mainImage', 'gallery']);
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }
    const media = await Media.find().sort({ createdAt: -1 }).limit(50);
    res.render('admin/products/edit', { product, media });
  } catch (error) {
    req.session.error = 'Error loading product';
    res.redirect('/admin/products');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, price, isTaxable, mainImage, gallery, status } = req.body;
    
    const galleryArray = Array.isArray(gallery) ? gallery : gallery ? [gallery] : [];
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price: parseFloat(price),
        isTaxable: isTaxable === 'on' || isTaxable === true,
        mainImage: mainImage || undefined,
        gallery: galleryArray,
        status: status || 'draft',
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }

    req.session.success = 'Product updated successfully';
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Update product error:', error);
    req.session.error = 'Error updating product';
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
};

exports.delete = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.session.success = 'Product deleted successfully';
    res.redirect('/admin/products');
  } catch (error) {
    req.session.error = 'Error deleting product';
    res.redirect('/admin/products');
  }
};

// Public routes
exports.publicIndex = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const products = await Product.find({ status: 'published' })
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ status: 'published' });
    const totalPages = Math.ceil(total / limit);

    res.render('public/products/index', {
      products,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    req.session.error = 'Error loading products';
    res.redirect('/');
  }
};

exports.publicShow = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'published' })
      .populate(['mainImage', 'gallery']);
    
    if (!product) {
      return res.status(404).render('errors/404');
    }

    res.render('public/products/show', { product });
  } catch (error) {
    res.status(500).render('errors/500', { error });
  }
};

