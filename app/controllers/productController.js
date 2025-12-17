const Product = require('../models/Product')
const Media = require('../models/Media')

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''
    const statusFilter = req.query.status || ''

    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ]
    }
    if (statusFilter) {
      query.status = statusFilter
    }

    const products = await Product.find(query)
      .populate('mainImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Product.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    res.render('admin/products/index', {
      products,
      currentPage: page,
      totalPages,
      search,
      statusFilter
    })
  } catch (error) {
    req.session.error = 'Error loading products'
    res.redirect('/admin')
  }
}

exports.show = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate([
      'mainImage',
      'gallery'
    ])
    if (!product) {
      req.session.error = 'Product not found'
      return res.redirect('/admin/products')
    }
    const media = await Media.find().sort({ createdAt: -1 }).limit(50)
    res.render('admin/products/show', { product, media })
  } catch (error) {
    req.session.error = 'Error loading product'
    res.redirect('/admin/products')
  }
}

exports.create = async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 }).limit(50)
    res.render('admin/products/create', { media })
  } catch (error) {
    req.session.error = 'Error loading form'
    res.redirect('/admin/products')
  }
}

exports.store = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      startingAtPrice,
      manufacturer,
      materials,
      saltwaterCompatible,
      isTaxable,
      mainImage,
      gallery,
      status,
      sizes,
      featured,
      isPublic,
      metaTitle,
      metaDescription,
      keywords,
      ogImage
    } = req.body

    // Handle gallery - can be array, comma-separated string, or single value
    let galleryArray = []
    if (gallery) {
      if (Array.isArray(gallery)) {
        galleryArray = gallery.filter(id => id && id.trim())
      } else if (typeof gallery === 'string' && gallery.includes(',')) {
        galleryArray = gallery
          .split(',')
          .map(id => id.trim())
          .filter(id => id)
      } else if (gallery.trim()) {
        galleryArray = [gallery.trim()]
      }
    }

    // Handle sizes - parse from form data (only name, no price or description)
    let sizesArray = []
    if (sizes && typeof sizes === 'object') {
      sizesArray = Object.keys(sizes)
        .map(key => {
          const size = sizes[key]
          if (size && size.name && size.name.trim()) {
            return {
              name: size.name.trim()
            }
          }
          return null
        })
        .filter(size => size !== null)
    }

    // Handle keywords - parse from comma-separated string
    let keywordsArray = []
    if (keywords && typeof keywords === 'string') {
      keywordsArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k)
    }

    const product = new Product({
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      description,
      price: price && price.trim() ? parseFloat(price) : undefined,
      cost: cost && cost.trim() ? parseFloat(cost) : undefined,
      startingAtPrice:
        startingAtPrice && startingAtPrice.trim()
          ? parseFloat(startingAtPrice)
          : undefined,
      manufacturer: manufacturer ? manufacturer.trim() : undefined,
      materials: materials ? materials.trim() : undefined,
      saltwaterCompatible:
        saltwaterCompatible === 'on' || saltwaterCompatible === true,
      isTaxable: isTaxable === 'on' || isTaxable === true,
      mainImage: mainImage || undefined,
      gallery: galleryArray,
      sizes: sizesArray,
      status: status || 'draft',
      featured: featured === 'true' || featured === 'on' || featured === true,
      isPublic: isPublic === 'on' || isPublic === true,
      metaTitle: metaTitle ? metaTitle.trim() : undefined,
      metaDescription: metaDescription ? metaDescription.trim() : undefined,
      keywords: keywordsArray,
      ogImage: ogImage || undefined
    })

    await product.save()
    req.session.success = 'Product created successfully'
    res.redirect('/admin/products')
  } catch (error) {
    console.error('Create product error:', error)
    req.session.error = 'Error creating product'
    res.redirect('/admin/products/create')
  }
}

exports.edit = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate([
      'mainImage',
      'gallery',
      'ogImage'
    ])
    if (!product) {
      req.session.error = 'Product not found'
      return res.redirect('/admin/products')
    }
    const media = await Media.find().sort({ createdAt: -1 }).limit(50)
    res.render('admin/products/edit', { product, media })
  } catch (error) {
    req.session.error = 'Error loading product'
    res.redirect('/admin/products')
  }
}

exports.update = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      cost,
      startingAtPrice,
      manufacturer,
      materials,
      saltwaterCompatible,
      isTaxable,
      mainImage,
      gallery,
      status,
      sizes,
      featured,
      isPublic,
      metaTitle,
      metaDescription,
      keywords,
      ogImage
    } = req.body

    // Handle gallery - can be array, comma-separated string, or single value
    let galleryArray = []
    if (gallery) {
      if (Array.isArray(gallery)) {
        galleryArray = gallery.filter(id => id && id.trim())
      } else if (typeof gallery === 'string' && gallery.includes(',')) {
        galleryArray = gallery
          .split(',')
          .map(id => id.trim())
          .filter(id => id)
      } else if (gallery.trim()) {
        galleryArray = [gallery.trim()]
      }
    }

    // Handle sizes - parse from form data (only name, no price or description)
    let sizesArray = []
    if (sizes && typeof sizes === 'object') {
      sizesArray = Object.keys(sizes)
        .map(key => {
          const size = sizes[key]
          if (size && size.name && size.name.trim()) {
            return {
              name: size.name.trim()
            }
          }
          return null
        })
        .filter(size => size !== null)
    }

    // Handle keywords - parse from comma-separated string
    let keywordsArray = []
    if (keywords && typeof keywords === 'string') {
      keywordsArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k)
    }

    // Build update object - only include price if provided
    const updateData = {
      name,
      description,
      cost: cost && cost.trim() ? parseFloat(cost) : null,
      startingAtPrice:
        startingAtPrice && startingAtPrice.trim()
          ? parseFloat(startingAtPrice)
          : null,
      manufacturer: manufacturer ? manufacturer.trim() : null,
      materials: materials ? materials.trim() : null,
      saltwaterCompatible:
        saltwaterCompatible === 'on' || saltwaterCompatible === true,
      isTaxable: isTaxable === 'on' || isTaxable === true,
      mainImage: mainImage || undefined,
      gallery: galleryArray,
      sizes: sizesArray,
      status: status || 'draft',
      featured: featured === 'true' || featured === 'on' || featured === true,
      isPublic: isPublic === 'on' || isPublic === true,
      metaTitle: metaTitle ? metaTitle.trim() : null,
      metaDescription: metaDescription ? metaDescription.trim() : null,
      keywords: keywordsArray,
      ogImage: ogImage || undefined
    }

    // Only update price if a value is provided (preserve existing if not)
    if (price && price.trim()) {
      updateData.price = parseFloat(price)
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })

    if (!product) {
      req.session.error = 'Product not found'
      return res.redirect('/admin/products')
    }

    req.session.success = 'Product updated successfully'
    res.redirect('/admin/products')
  } catch (error) {
    console.error('Update product error:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    req.session.error = `Error updating product: ${error.message}`
    res.redirect(`/admin/products/${req.params.id}/edit`)
  }
}

exports.delete = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id)
    req.session.success = 'Product deleted successfully'
    res.redirect('/admin/products')
  } catch (error) {
    req.session.error = 'Error deleting product'
    res.redirect('/admin/products')
  }
}

// Helper function to add timeout to promises
const withTimeout = (promise, timeoutMs = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ])
}

// Public routes
exports.publicIndex = async (req, res) => {
  try {
    const mongoose = require('mongoose')

    // Check database connection before queries
    // If not connected, show empty page instead of crashing
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️  Database not connected, showing empty products page')
      return res.render('public/products/index', {
        products: [],
        currentPage: 1,
        totalPages: 0
      })
    }

    const page = parseInt(req.query.page) || 1
    const limit = 12
    const skip = (page - 1) * limit

    // Add timeout to prevent hanging queries
    const products = await withTimeout(
      Product.find({ status: 'published', isPublic: true })
        .populate('mainImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance
      5000
    )

    const total = await withTimeout(
      Product.countDocuments({ status: 'published', isPublic: true }),
      5000
    )

    const totalPages = Math.ceil(total / limit)

    // Log if no products found
    if (products.length === 0 && page === 1) {
      console.warn('⚠️  Products page: No published products found in database')
    }

    res.render('public/products/index', {
      products,
      currentPage: page,
      totalPages
    })
  } catch (error) {
    console.error('❌ Error loading products:', error.message)
    console.error('❌ Error code:', error.code || 'UNKNOWN')

    // Log database connection state
    const mongoose = require('mongoose')
    const dbState = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    console.error(`❌ Database state: ${states[dbState]} (${dbState})`)

    // If timeout or error, show empty state instead of redirecting
    res.render('public/products/index', {
      products: [],
      currentPage: 1,
      totalPages: 0
    })
  }
}

exports.publicShow = async (req, res) => {
  try {
    // Add timeout to prevent hanging queries
    const product = await withTimeout(
      Product.findOne({ slug: req.params.slug, status: 'published' })
        .populate(['mainImage', 'gallery', 'ogImage'])
        .lean(), // Use lean() for better performance
      5000
    )

    if (!product) {
      return res.status(404).render('errors/404')
    }

    // Don't pass seoData to prevent metadata from showing on product pages
    res.render('public/products/show', { product })
  } catch (error) {
    console.error('Error loading product:', error.message)
    res.status(500).render('errors/500', { error })
  }
}

// API endpoint for creating product (returns JSON for client-side use)
exports.createAPI = async (req, res) => {
  try {
    const { name, description, price, cost, sku, isTaxable, status } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' })
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const product = new Product({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      price: price ? parseFloat(price) : 0,
      cost: cost ? parseFloat(cost) : 0,
      sku: sku ? sku.trim() : undefined,
      isTaxable: isTaxable === true || isTaxable === 'true',
      status: status || 'draft',
      isActive: true
    })

    await product.save()

    // Return formatted product for frontend
    res.json({
      _id: product._id,
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      price: product.price || 0,
      cost: product.cost || 0,
      taxable: product.isTaxable !== false
    })
  } catch (error) {
    console.error('Product create API error:', error)
    if (error.code === 11000) {
      // Duplicate key error
      return res
        .status(400)
        .json({ error: 'Product with this name or SKU already exists' })
    }
    res.status(500).json({ error: error.message || 'Error creating product' })
  }
}

// API endpoint for product search (for sales line items)
exports.search = async (req, res) => {
  try {
    const query = req.query.query || ''
    const limit = parseInt(req.query.limit) || 20

    const searchQuery = {}
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }

    // Only search active products
    searchQuery.isActive = { $ne: false }
    if (!searchQuery.isActive) {
      delete searchQuery.isActive
    }

    const products = await Product.find(searchQuery)
      .select('_id name sku description price cost isTaxable')
      .limit(limit)
      .sort({ name: 1 })
      .lean()

    // Format response for frontend
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      price: product.price || 0,
      cost: product.cost || 0,
      taxable: product.isTaxable !== false // Default to true
    }))

    res.json(formattedProducts)
  } catch (error) {
    console.error('Product search error:', error)
    res.status(500).json({ error: 'Error searching products' })
  }
}
