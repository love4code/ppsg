const Sale = require('../models/Sale')
const Customer = require('../models/Customer')
const Product = require('../models/Product')

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 20
    const skip = (page - 1) * limit
    const statusFilter = req.query.status || ''
    const paymentFilter = req.query.paymentStatus || ''
    const customerFilter = req.query.customer || ''
    const dateFrom = req.query.dateFrom || ''
    const dateTo = req.query.dateTo || ''

    const query = {}
    if (statusFilter) {
      query.status = statusFilter
    }
    if (paymentFilter) {
      query.paymentStatus = paymentFilter
    }
    if (customerFilter) {
      query.customer = customerFilter
    }
    if (dateFrom || dateTo) {
      query.saleDate = {}
      if (dateFrom) {
        query.saleDate.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        query.saleDate.$lte = new Date(dateTo)
        query.saleDate.$lte.setHours(23, 59, 59, 999)
      }
    }

    const sales = await Sale.find(query)
      .populate('customer', 'name email phone')
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Sale.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    // Get customers for filter dropdown
    const customers = await Customer.find({ status: 'active' })
      .sort({ name: 1 })
      .select('name')

    res.render('admin/sales/index', {
      sales,
      customers,
      currentPage: page,
      totalPages,
      statusFilter,
      paymentFilter,
      customerFilter,
      dateFrom,
      dateTo,
      activePage: 'sales'
    })
  } catch (error) {
    console.error('Sale index error:', error)
    req.session.error = 'Error loading sales'
    res.redirect('/admin')
  }
}

exports.show = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customer')
    if (!sale) {
      req.session.error = 'Sale not found'
      return res.redirect('/admin/sales')
    }
    res.render('admin/sales/show', {
      sale,
      activePage: 'sales'
    })
  } catch (error) {
    console.error('Sale show error:', error)
    req.session.error = 'Error loading sale'
    res.redirect('/admin/sales')
  }
}

exports.create = async (req, res) => {
  try {
    const customerId = req.params.customerId
    const customer = customerId ? await Customer.findById(customerId) : null

    if (customerId && !customer) {
      req.session.error = 'Customer not found'
      return res.redirect('/admin/customers')
    }

    const customers = await Customer.find({ status: 'active' })
      .sort({ name: 1 })
      .select('name email')

    res.render('admin/sales/new', {
      sale: null,
      customer,
      customers,
      activePage: 'sales'
    })
  } catch (error) {
    console.error('Sale create error:', error)
    req.session.error = 'Error loading form'
    res.redirect('/admin/sales')
  }
}

exports.store = async (req, res) => {
  try {
    const {
      customer: customerIdFromBody,
      saleDate,
      status,
      paymentStatus,
      taxRate,
      notes,
      lineItems
    } = req.body

    // Customer ID can come from route params (nested route) or form body
    const customerId = req.params.customerId || customerIdFromBody

    if (!customerId) {
      req.session.error = 'Customer is required'
      return res.redirect(
        req.params.customerId
          ? `/admin/customers/${req.params.customerId}/sales/new`
          : '/admin/sales/new'
      )
    }

    const customer = await Customer.findById(customerId)
    if (!customer) {
      req.session.error = 'Customer not found'
      return res.redirect(
        req.params.customerId
          ? `/admin/customers/${req.params.customerId}/sales/new`
          : '/admin/sales/new'
      )
    }

    // Parse line items
    const parsedLineItems = []
    if (Array.isArray(lineItems)) {
      for (const item of lineItems) {
        if (!item.name || !item.unitPrice || !item.quantity) {
          continue // Skip invalid items
        }

        const cost = Math.max(0, parseFloat(item.cost) || 0)
        const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0)
        const quantity = Math.max(1, parseInt(item.quantity) || 1)
        const taxable = item.taxable === 'true' || item.taxable === true

        parsedLineItems.push({
          productId: item.productId || undefined,
          name: item.name.trim(),
          sku: item.sku ? item.sku.trim() : undefined,
          description: item.description ? item.description.trim() : '',
          taxable: taxable,
          cost: cost,
          unitPrice: unitPrice,
          quantity: quantity
        })
      }
    }

    if (parsedLineItems.length === 0) {
      req.session.error = 'At least one line item is required'
      return res.redirect(
        req.params.customerId
          ? `/admin/customers/${req.params.customerId}/sales/new`
          : '/admin/sales/new'
      )
    }

    const sale = new Sale({
      customer: customerId,
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      status: status || 'open',
      paymentStatus: paymentStatus || 'unpaid',
      taxRate: Math.max(0, Math.min(1, (parseFloat(taxRate) || 6.25) / 100)),
      notes: notes ? notes.trim() : '',
      lineItems: parsedLineItems
    })

    // Calculate totals (will be done by pre-save hook, but ensure it happens)
    sale.calculateTotals()

    await sale.save()
    req.session.success = 'Sale created successfully'
    res.redirect(`/admin/sales/${sale._id}`)
  } catch (error) {
    console.error('Create sale error:', error)
    req.session.error = error.message || 'Error creating sale'
    res.redirect(
      req.params.customerId
        ? `/admin/customers/${req.params.customerId}/sales/new`
        : '/admin/sales/new'
    )
  }
}

exports.edit = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customer')
    if (!sale) {
      req.session.error = 'Sale not found'
      return res.redirect('/admin/sales')
    }

    const customers = await Customer.find({ status: 'active' })
      .sort({ name: 1 })
      .select('name email')

    res.render('admin/sales/edit', {
      sale,
      customers,
      activePage: 'sales'
    })
  } catch (error) {
    console.error('Sale edit error:', error)
    req.session.error = 'Error loading sale'
    res.redirect('/admin/sales')
  }
}

exports.update = async (req, res) => {
  try {
    const {
      customer: customerId,
      saleDate,
      status,
      paymentStatus,
      taxRate,
      notes,
      lineItems
    } = req.body

    if (!customerId) {
      req.session.error = 'Customer is required'
      return res.redirect(`/admin/sales/${req.params.id}/edit`)
    }

    // Parse line items
    const parsedLineItems = []
    if (Array.isArray(lineItems)) {
      for (const item of lineItems) {
        if (!item.name || !item.unitPrice || !item.quantity) {
          continue
        }

        const cost = Math.max(0, parseFloat(item.cost) || 0)
        const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0)
        const quantity = Math.max(1, parseInt(item.quantity) || 1)
        const taxable = item.taxable === 'true' || item.taxable === true

        parsedLineItems.push({
          productId: item.productId || undefined,
          name: item.name.trim(),
          sku: item.sku ? item.sku.trim() : undefined,
          description: item.description ? item.description.trim() : '',
          taxable: taxable,
          cost: cost,
          unitPrice: unitPrice,
          quantity: quantity
        })
      }
    }

    if (parsedLineItems.length === 0) {
      req.session.error = 'At least one line item is required'
      return res.redirect(`/admin/sales/${req.params.id}/edit`)
    }

    const sale = await Sale.findById(req.params.id)
    if (!sale) {
      req.session.error = 'Sale not found'
      return res.redirect('/admin/sales')
    }

    sale.customer = customerId
    sale.saleDate = saleDate ? new Date(saleDate) : sale.saleDate
    sale.status = status || sale.status
    sale.paymentStatus = paymentStatus || sale.paymentStatus
    sale.taxRate = Math.max(0, Math.min(1, parseFloat(taxRate) || sale.taxRate))
    sale.notes = notes ? notes.trim() : ''
    sale.lineItems = parsedLineItems

    sale.calculateTotals()
    await sale.save()

    req.session.success = 'Sale updated successfully'
    res.redirect(`/admin/sales/${sale._id}`)
  } catch (error) {
    console.error('Update sale error:', error)
    req.session.error = error.message || 'Error updating sale'
    res.redirect(`/admin/sales/${req.params.id}/edit`)
  }
}

exports.delete = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
    if (!sale) {
      req.session.error = 'Sale not found'
      return res.redirect('/admin/sales')
    }

    await Sale.findByIdAndDelete(req.params.id)

    req.session.success = 'Sale deleted successfully'
    res.redirect('/admin/sales')
  } catch (error) {
    console.error('Delete sale error:', error)
    req.session.error = 'Error deleting sale'
    res.redirect('/admin/sales')
  }
}

