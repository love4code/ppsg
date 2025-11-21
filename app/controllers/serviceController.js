const Service = require('../models/Service')

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

    const services = await Service.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Service.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    res.render('admin/services/index', {
      services,
      currentPage: page,
      totalPages,
      search,
      statusFilter
    })
  } catch (error) {
    req.session.error = 'Error loading services'
    res.redirect('/admin')
  }
}

exports.show = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
    if (!service) {
      req.session.error = 'Service not found'
      return res.redirect('/admin/services')
    }
    res.render('admin/services/show', { service })
  } catch (error) {
    req.session.error = 'Error loading service'
    res.redirect('/admin/services')
  }
}

exports.create = async (req, res) => {
  try {
    res.render('admin/services/create')
  } catch (error) {
    req.session.error = 'Error loading form'
    res.redirect('/admin/services')
  }
}

exports.store = async (req, res) => {
  try {
    const { name, description, basePrice, icon, status } = req.body

    if (!icon || !icon.trim()) {
      req.session.error = 'Icon is required'
      return res.redirect('/admin/services/create')
    }

    // Handle basePrice - set to null if empty/blank, otherwise parse as float
    let parsedBasePrice = null
    if (basePrice && basePrice !== '' && basePrice !== null) {
      const parsed = parseFloat(basePrice)
      parsedBasePrice = isNaN(parsed) ? null : parsed
    }

    const service = new Service({
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      description,
      basePrice: parsedBasePrice,
      icon: icon.trim(),
      status: status || 'draft'
    })

    await service.save()
    req.session.success = 'Service created successfully'
    res.redirect('/admin/services')
  } catch (error) {
    console.error('Create service error:', error)
    req.session.error = 'Error creating service'
    res.redirect('/admin/services/create')
  }
}

exports.edit = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
    if (!service) {
      req.session.error = 'Service not found'
      return res.redirect('/admin/services')
    }
    res.render('admin/services/edit', { service })
  } catch (error) {
    req.session.error = 'Error loading service'
    res.redirect('/admin/services')
  }
}

exports.update = async (req, res) => {
  try {
    const { name, description, basePrice, icon, status } = req.body

    if (!icon || !icon.trim()) {
      req.session.error = 'Icon is required'
      return res.redirect(`/admin/services/${req.params.id}/edit`)
    }

    // Handle basePrice - set to null if empty/blank, otherwise parse as float
    const updateData = {
      name,
      description,
      icon: icon.trim(),
      status: status || 'draft'
    }

    // Explicitly handle basePrice - if empty string or undefined, set to null to clear it
    if (basePrice === '' || basePrice === null || basePrice === undefined) {
      updateData.basePrice = null
    } else {
      const parsedPrice = parseFloat(basePrice)
      updateData.basePrice = isNaN(parsedPrice) ? null : parsedPrice
    }

    const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })

    if (!service) {
      req.session.error = 'Service not found'
      return res.redirect('/admin/services')
    }

    req.session.success = 'Service updated successfully'
    res.redirect('/admin/services')
  } catch (error) {
    console.error('Update service error:', error)
    req.session.error = 'Error updating service'
    res.redirect(`/admin/services/${req.params.id}/edit`)
  }
}

exports.delete = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id)
    req.session.success = 'Service deleted successfully'
    res.redirect('/admin/services')
  } catch (error) {
    req.session.error = 'Error deleting service'
    res.redirect('/admin/services')
  }
}

// Public routes
exports.publicIndex = async (req, res) => {
  try {
    const services = await Service.find({ status: 'published' }).sort({
      createdAt: -1
    })

    res.render('public/services/index', { services })
  } catch (error) {
    req.session.error = 'Error loading services'
    res.redirect('/')
  }
}

exports.publicShow = async (req, res) => {
  try {
    const service = await Service.findOne({
      slug: req.params.slug,
      status: 'published'
    })

    if (!service) {
      return res.status(404).render('errors/404')
    }

    res.render('public/services/show', { service })
  } catch (error) {
    res.status(500).render('errors/500', { error })
  }
}
