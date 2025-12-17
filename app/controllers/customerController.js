const Customer = require('../models/Customer')
const Sale = require('../models/Sale')

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 20
    const skip = (page - 1) * limit
    const search = req.query.search || ''
    const statusFilter = req.query.status || ''

    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }
    if (statusFilter) {
      query.status = statusFilter
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Customer.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    res.render('admin/customers/index', {
      customers,
      currentPage: page,
      totalPages,
      search,
      statusFilter,
      activePage: 'customers'
    })
  } catch (error) {
    console.error('Customer index error:', error)
    req.session.error = 'Error loading customers'
    res.redirect('/admin')
  }
}

exports.show = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      req.session.error = 'Customer not found'
      return res.redirect('/admin/customers')
    }

    // Get recent sales for this customer
    const sales = await Sale.find({ customer: customer._id })
      .sort({ saleDate: -1 })
      .limit(10)

    res.render('admin/customers/show', {
      customer,
      sales,
      activePage: 'customers'
    })
  } catch (error) {
    console.error('Customer show error:', error)
    req.session.error = 'Error loading customer'
    res.redirect('/admin/customers')
  }
}

exports.create = async (req, res) => {
  try {
    res.render('admin/customers/new', {
      customer: null,
      activePage: 'customers'
    })
  } catch (error) {
    req.session.error = 'Error loading form'
    res.redirect('/admin/customers')
  }
}

exports.store = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      'address.street': street,
      'address.city': city,
      'address.state': state,
      'address.zip': zip,
      notes,
      status
    } = req.body

    const customer = new Customer({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone ? phone.trim() : undefined,
      address: {
        street: street ? street.trim() : undefined,
        city: city ? city.trim() : undefined,
        state: state ? state.trim() : undefined,
        zip: zip ? zip.trim() : undefined
      },
      notes: notes ? notes.trim() : '',
      status: status || 'active'
    })

    await customer.save()
    req.session.success = 'Customer created successfully'
    res.redirect('/admin/customers')
  } catch (error) {
    console.error('Create customer error:', error)
    req.session.error = error.message || 'Error creating customer'
    res.redirect('/admin/customers/new')
  }
}

exports.edit = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      req.session.error = 'Customer not found'
      return res.redirect('/admin/customers')
    }
    res.render('admin/customers/edit', {
      customer,
      activePage: 'customers'
    })
  } catch (error) {
    req.session.error = 'Error loading customer'
    res.redirect('/admin/customers')
  }
}

exports.update = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      'address.street': street,
      'address.city': city,
      'address.state': state,
      'address.zip': zip,
      notes,
      status
    } = req.body

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : undefined,
        phone: phone ? phone.trim() : undefined,
        address: {
          street: street ? street.trim() : undefined,
          city: city ? city.trim() : undefined,
          state: state ? state.trim() : undefined,
          zip: zip ? zip.trim() : undefined
        },
        notes: notes ? notes.trim() : '',
        status: status || 'active'
      },
      { new: true, runValidators: true }
    )

    if (!customer) {
      req.session.error = 'Customer not found'
      return res.redirect('/admin/customers')
    }

    req.session.success = 'Customer updated successfully'
    res.redirect('/admin/customers')
  } catch (error) {
    console.error('Update customer error:', error)
    req.session.error = error.message || 'Error updating customer'
    res.redirect(`/admin/customers/${req.params.id}/edit`)
  }
}

exports.delete = async (req, res) => {
  try {
    // Check if customer has sales
    const salesCount = await Sale.countDocuments({ customer: req.params.id })
    if (salesCount > 0) {
      // Soft delete by setting status to inactive
      await Customer.findByIdAndUpdate(req.params.id, { status: 'inactive' })
      req.session.success = 'Customer marked as inactive (has existing sales)'
    } else {
      await Customer.findByIdAndDelete(req.params.id)
      req.session.success = 'Customer deleted successfully'
    }
    res.redirect('/admin/customers')
  } catch (error) {
    console.error('Delete customer error:', error)
    req.session.error = 'Error deleting customer'
    res.redirect('/admin/customers')
  }
}

