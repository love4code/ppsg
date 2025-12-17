// Admin Sales Line Item Management
;(function () {
  let lineItemIndex = 0
  let searchTimeout = null
  let selectedProduct = null

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function () {
    initializeLineItems()
    initializeProductSearch()
    initializeEventListeners()
    updateTotals()
  })

  // Initialize existing line items (for edit page)
  function initializeLineItems () {
    const tbody = document.getElementById('lineItemsBody')
    if (!tbody) return

    // Count existing items to set starting index
    const existingRows = tbody.querySelectorAll('tr[data-item-index]')
    if (existingRows.length > 0) {
      const maxIndex = Math.max(
        ...Array.from(existingRows).map(
          row => parseInt(row.getAttribute('data-item-index')) || 0
        )
      )
      lineItemIndex = maxIndex + 1
    }

    // Add event listeners to existing inputs
    existingRows.forEach(row => {
      attachLineItemListeners(row)
    })
  }

  // Initialize product search
  function initializeProductSearch () {
    const searchInput = document.getElementById('productSearch')
    const addBtn = document.getElementById('addProductBtn')
    const resultsDiv = document.getElementById('productSearchResults')

    if (!searchInput || !resultsDiv) return

    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout)
      const query = this.value.trim()

      if (query.length < 1) {
        resultsDiv.style.display = 'none'
        return
      }

      searchTimeout = setTimeout(() => {
        searchProducts(query)
      }, 200)
    })

    // Handle manual add button click
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        const query = searchInput.value.trim()
        if (query && selectedProduct) {
          addLineItemFromProduct(selectedProduct)
          searchInput.value = ''
          selectedProduct = null
          resultsDiv.style.display = 'none'
        }
      })
    }

    // Hide results when clicking outside
    document.addEventListener('click', function (e) {
      if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
        resultsDiv.style.display = 'none'
      }
    })
  }

  // Search products via API
  async function searchProducts (query) {
    const resultsDiv = document.getElementById('productSearchResults')

    try {
      const response = await fetch(
        `/admin/api/products?query=${encodeURIComponent(query)}&limit=10`
      )
      const products = await response.json()

      if (products.length === 0) {
        resultsDiv.innerHTML =
          '<div class="list-group-item">No products found</div>'
        resultsDiv.style.display = 'block'
        return
      }

      resultsDiv.innerHTML = products
        .map(
          product => `
                <a href="#" class="list-group-item list-group-item-action" 
                   data-product-id="${product._id}"
                   data-product-name="${escapeHtml(product.name)}"
                   data-product-sku="${escapeHtml(product.sku || '')}"
                   data-product-description="${escapeHtml(
                     product.description || ''
                   )}"
                   data-product-price="${product.price || 0}"
                   data-product-cost="${product.cost || 0}"
                   data-product-taxable="${product.taxable}">
                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>${escapeHtml(product.name)}</strong>
                        ${
                          product.sku
                            ? `<br><small class="text-muted">SKU: ${escapeHtml(
                                product.sku
                              )}</small>`
                            : ''
                        }
                      </div>
                      <div class="text-end ms-3">
                        <small class="text-muted">Cost: $${(
                          product.cost || 0
                        ).toFixed(2)}</small><br>
                        <small class="text-success">Price: $${(
                          product.price || 0
                        ).toFixed(2)}</small>
                        ${
                          product.cost && product.price
                            ? `<br><small class="text-info">Profit: $${(
                                product.price - product.cost
                              ).toFixed(2)}</small>`
                            : ''
                        }
                      </div>
                    </div>
                </a>
            `
        )
        .join('')

      // Add click handlers
      resultsDiv.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function (e) {
          e.preventDefault()
          const product = {
            _id: this.getAttribute('data-product-id'),
            name: this.getAttribute('data-product-name'),
            sku: this.getAttribute('data-product-sku'),
            description: this.getAttribute('data-product-description'),
            price: parseFloat(this.getAttribute('data-product-price')),
            cost: parseFloat(this.getAttribute('data-product-cost')),
            taxable: this.getAttribute('data-product-taxable') === 'true'
          }
          selectedProduct = product
          addLineItemFromProduct(product)
          document.getElementById('productSearch').value = ''
          resultsDiv.style.display = 'none'
        })
      })

      resultsDiv.style.display = 'block'
    } catch (error) {
      console.error('Error searching products:', error)
      resultsDiv.innerHTML =
        '<div class="list-group-item text-danger">Error searching products</div>'
      resultsDiv.style.display = 'block'
    }
  }

  // Add line item from product
  function addLineItemFromProduct (product) {
    const tbody = document.getElementById('lineItemsBody')
    if (!tbody) return

    const row = document.createElement('tr')
    row.setAttribute('data-item-index', lineItemIndex)

    row.innerHTML = `
            <td>
                <input type="hidden" name="lineItems[${lineItemIndex}][productId]" value="${
      product._id || ''
    }">
                <input type="text" class="form-control" name="lineItems[${lineItemIndex}][name]" value="${escapeHtml(
      product.name
    )}" required readonly>
                <textarea class="form-control mt-1" name="lineItems[${lineItemIndex}][description]" rows="1" placeholder="Description">${escapeHtml(
      product.description || ''
    )}</textarea>
            </td>
            <td>
                <input type="text" class="form-control" name="lineItems[${lineItemIndex}][sku]" value="${escapeHtml(
      product.sku || ''
    )}" readonly>
            </td>
            <td>
                <input type="number" class="form-control quantity-input" name="lineItems[${lineItemIndex}][quantity]" value="1" min="1" step="1" required>
            </td>
            <td>
                <input type="number" class="form-control cost-input" name="lineItems[${lineItemIndex}][cost]" value="${
      product.cost || 0
    }" min="0" step="0.01" required>
            </td>
            <td>
                <input type="number" class="form-control price-input" name="lineItems[${lineItemIndex}][unitPrice]" value="${
      product.price || 0
    }" min="0" step="0.01" required>
            </td>
            <td>
                <input type="checkbox" class="form-check-input taxable-checkbox" name="lineItems[${lineItemIndex}][taxable]" value="true" ${
      product.taxable ? 'checked' : ''
    }>
            </td>
            <td class="line-subtotal">$0.00</td>
            <td class="line-tax">$0.00</td>
            <td class="line-total"><strong>$0.00</strong></td>
            <td class="line-profit">$0.00</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger remove-line-item">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `

    tbody.appendChild(row)
    attachLineItemListeners(row)
    lineItemIndex++
    updateTotals()
  }

  // Attach event listeners to line item inputs
  function attachLineItemListeners (row) {
    const quantityInput = row.querySelector('.quantity-input')
    const costInput = row.querySelector('.cost-input')
    const priceInput = row.querySelector('.price-input')
    const taxableCheckbox = row.querySelector('.taxable-checkbox')
    const removeBtn = row.querySelector('.remove-line-item')

    if (quantityInput) {
      quantityInput.addEventListener(
        'input',
        updateLineItemTotals.bind(null, row)
      )
      quantityInput.addEventListener('change', updateTotals)
    }

    if (costInput) {
      costInput.addEventListener('input', updateLineItemTotals.bind(null, row))
      costInput.addEventListener('change', updateTotals)
    }

    if (priceInput) {
      priceInput.addEventListener('input', updateLineItemTotals.bind(null, row))
      priceInput.addEventListener('change', updateTotals)
    }

    if (taxableCheckbox) {
      taxableCheckbox.addEventListener(
        'change',
        updateLineItemTotals.bind(null, row)
      )
      taxableCheckbox.addEventListener('change', updateTotals)
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        row.remove()
        updateTotals()
        reindexLineItems()
      })
    }
  }

  // Update totals for a single line item
  function updateLineItemTotals (row) {
    const quantity = parseFloat(row.querySelector('.quantity-input').value) || 0
    const cost = parseFloat(row.querySelector('.cost-input')?.value) || 0
    const unitPrice = parseFloat(row.querySelector('.price-input').value) || 0
    const taxable = row.querySelector('.taxable-checkbox').checked
    const taxRate =
      parseFloat(document.getElementById('taxRate').value) / 100 || 0.0625

    const lineSubtotal = quantity * unitPrice
    const lineTax = taxable ? lineSubtotal * taxRate : 0
    const lineTotal = lineSubtotal + lineTax
    const lineProfit = (unitPrice - cost) * quantity

    row.querySelector('.line-subtotal').textContent =
      '$' + lineSubtotal.toFixed(2)
    row.querySelector('.line-tax').textContent = '$' + lineTax.toFixed(2)
    row.querySelector('.line-total').innerHTML =
      '<strong>$' + lineTotal.toFixed(2) + '</strong>'

    const profitCell = row.querySelector('.line-profit')
    if (profitCell) {
      profitCell.textContent = '$' + lineProfit.toFixed(2)
      profitCell.className =
        'line-profit ' + (lineProfit >= 0 ? 'text-success' : 'text-danger')
    }
  }

  // Update all totals
  function updateTotals () {
    const tbody = document.getElementById('lineItemsBody')
    const taxRateInput = document.getElementById('taxRate')
    if (!tbody || !taxRateInput) return

    const taxRate = parseFloat(taxRateInput.value) / 100 || 0.0625
    let subtotal = 0
    let taxTotal = 0
    let totalCost = 0
    let totalProfit = 0

    tbody.querySelectorAll('tr').forEach(row => {
      updateLineItemTotals(row)

      const quantity =
        parseFloat(row.querySelector('.quantity-input').value) || 0
      const cost = parseFloat(row.querySelector('.cost-input')?.value) || 0
      const unitPrice = parseFloat(row.querySelector('.price-input').value) || 0
      const taxable = row.querySelector('.taxable-checkbox').checked

      const lineSubtotal = quantity * unitPrice
      const lineTax = taxable ? lineSubtotal * taxRate : 0
      const lineCost = cost * quantity
      const lineProfit = (unitPrice - cost) * quantity

      subtotal += lineSubtotal
      taxTotal += lineTax
      totalCost += lineCost
      totalProfit += lineProfit
    })

    const total = subtotal + taxTotal

    const subtotalEl = document.getElementById('previewSubtotal')
    const taxTotalEl = document.getElementById('previewTaxTotal')
    const totalEl = document.getElementById('previewTotal')
    const totalCostEl = document.getElementById('previewTotalCost')
    const totalProfitEl = document.getElementById('previewTotalProfit')

    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2)
    if (taxTotalEl) taxTotalEl.textContent = '$' + taxTotal.toFixed(2)
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2)
    if (totalCostEl) {
      totalCostEl.textContent = '$' + totalCost.toFixed(2)
      totalCostEl.className = totalCostEl.className.replace(/text-\w+/g, '')
    }
    if (totalProfitEl) {
      totalProfitEl.textContent = '$' + totalProfit.toFixed(2)
      totalProfitEl.className = totalProfitEl.className.replace(/text-\w+/g, '')
      totalProfitEl.className +=
        totalProfit >= 0 ? ' text-success' : ' text-danger'
    }

    // Update tax rate listener
    if (!taxRateInput.hasAttribute('data-listener-attached')) {
      taxRateInput.setAttribute('data-listener-attached', 'true')
      taxRateInput.addEventListener('input', updateTotals)
      taxRateInput.addEventListener('change', updateTotals)
    }
  }

  // Reindex line items after removal
  function reindexLineItems () {
    const tbody = document.getElementById('lineItemsBody')
    if (!tbody) return

    let newIndex = 0
    tbody.querySelectorAll('tr').forEach(row => {
      // Update all input names with new index
      row.querySelectorAll('input, textarea').forEach(input => {
        const name = input.getAttribute('name')
        if (name && name.includes('lineItems[')) {
          const newName = name.replace(
            /lineItems\[\d+\]/,
            `lineItems[${newIndex}]`
          )
          input.setAttribute('name', newName)
        }
      })
      row.setAttribute('data-item-index', newIndex)
      newIndex++
    })
    lineItemIndex = newIndex
  }

  // Initialize event listeners
  function initializeEventListeners () {
    // Form validation
    const form = document.getElementById('saleForm')
    if (form) {
      form.addEventListener('submit', function (e) {
        const tbody = document.getElementById('lineItemsBody')
        if (!tbody || tbody.querySelectorAll('tr').length === 0) {
          e.preventDefault()
          alert('Please add at least one line item.')
          return false
        }
      })
    }

    // Create product modal handlers
    const createProductBtn = document.getElementById('saveNewProductBtn')
    const createProductForm = document.getElementById('createProductForm')
    const createProductModal = document.getElementById('createProductModal')

    if (createProductBtn && createProductForm) {
      createProductBtn.addEventListener('click', async function () {
        await createAndAddProduct()
      })

      // Allow Enter key to submit
      createProductForm.addEventListener('submit', async function (e) {
        e.preventDefault()
        await createAndAddProduct()
      })
    }

    // Clear form when modal is closed
    if (createProductModal) {
      createProductModal.addEventListener('hidden.bs.modal', function () {
        createProductForm.reset()
        // Reset to defaults
        document.getElementById('newProductCost').value = '0'
        document.getElementById('newProductPrice').value = '0'
        document.getElementById('newProductTaxable').checked = true
        document.getElementById('newProductStatus').value = 'draft'
      })
    }
  }

  // Create product and add to line items
  async function createAndAddProduct () {
    const createProductBtn = document.getElementById('saveNewProductBtn')
    const form = document.getElementById('createProductForm')
    const modal = document.getElementById('createProductModal')

    if (!form || !createProductBtn) return

    // Validate form
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    // Get form data
    const formData = {
      name: document.getElementById('newProductName').value.trim(),
      description: document
        .getElementById('newProductDescription')
        .value.trim(),
      sku: document.getElementById('newProductSKU').value.trim(),
      cost: parseFloat(document.getElementById('newProductCost').value) || 0,
      price: parseFloat(document.getElementById('newProductPrice').value) || 0,
      isTaxable: document.getElementById('newProductTaxable').checked,
      status: document.getElementById('newProductStatus').value
    }

    if (!formData.name) {
      alert('Product name is required')
      return
    }

    // Disable button and show loading
    createProductBtn.disabled = true
    const originalText = createProductBtn.innerHTML
    createProductBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Creating...'

    try {
      const response = await fetch('/admin/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error creating product')
      }

      // Product created successfully, add it to line items
      const product = {
        _id: data._id,
        name: data.name,
        sku: data.sku || '',
        description: data.description || '',
        price: data.price || 0,
        cost: data.cost || 0,
        taxable: data.taxable
      }

      // Close modal
      const bsModal = bootstrap.Modal.getInstance(modal)
      if (bsModal) {
        bsModal.hide()
      }

      // Add product to line items
      addLineItemFromProduct(product)

      // Show success message
      const searchInput = document.getElementById('productSearch')
      if (searchInput) {
        searchInput.value = ''
      }
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Error creating product: ' + error.message)
    } finally {
      // Re-enable button
      createProductBtn.disabled = false
      createProductBtn.innerHTML = originalText
    }
  }

  // Utility: Escape HTML
  function escapeHtml (text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return (text || '').replace(/[&<>"']/g, m => map[m])
  }
})()
