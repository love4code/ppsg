const mongoose = require('mongoose')

const saleLineItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    taxable: {
      type: Boolean,
      default: true
    },
    cost: {
      type: Number,
      min: 0,
      default: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    lineSubtotal: {
      type: Number,
      required: true,
      min: 0
    },
    lineTax: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: true }
)

const saleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    saleDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'paid', 'cancelled'],
      default: 'open'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid'
    },
    notes: {
      type: String,
      default: ''
    },
    taxRate: {
      type: Number,
      default: 0.0625,
      min: 0,
      max: 1
    },
    lineItems: [saleLineItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    taxTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

// Calculate totals before validation
saleSchema.pre('validate', function (next) {
  this.calculateTotals()
  next()
})

// Calculate totals before save
saleSchema.pre('save', function (next) {
  this.calculateTotals()
  next()
})

// Method to calculate all totals
saleSchema.methods.calculateTotals = function () {
  let subtotal = 0
  let taxTotal = 0

  this.lineItems.forEach(item => {
    // Calculate line subtotal
    item.lineSubtotal = item.unitPrice * item.quantity

    // Calculate line tax if taxable
    item.lineTax = item.taxable ? item.lineSubtotal * this.taxRate : 0

    // Calculate line total
    item.lineTotal = item.lineSubtotal + item.lineTax

    // Add to totals
    subtotal += item.lineSubtotal
    taxTotal += item.lineTax
  })

  this.subtotal = subtotal
  this.taxTotal = taxTotal
  this.total = subtotal + taxTotal
}

module.exports = mongoose.model('Sale', saleSchema)
