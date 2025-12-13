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

      if (query.length < 2) {
        resultsDiv.style.display = 'none'
        return
      }

      searchTimeout = setTimeout(() => {
        searchProducts(query)
      }, 300)
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
                   data-product-taxable="${product.taxable}">
                    <strong>${escapeHtml(product.name)}</strong>
                    ${
                      product.sku
                        ? `<br><small class="text-muted">SKU: ${escapeHtml(
                            product.sku
                          )}</small>`
                        : ''
                    }
                    <br><small>$${(product.price || 0).toFixed(2)}</small>
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
    const unitPrice = parseFloat(row.querySelector('.price-input').value) || 0
    const taxable = row.querySelector('.taxable-checkbox').checked
    const taxRate =
      parseFloat(document.getElementById('taxRate').value) / 100 || 0.0625

    const lineSubtotal = quantity * unitPrice
    const lineTax = taxable ? lineSubtotal * taxRate : 0
    const lineTotal = lineSubtotal + lineTax

    row.querySelector('.line-subtotal').textContent =
      '$' + lineSubtotal.toFixed(2)
    row.querySelector('.line-tax').textContent = '$' + lineTax.toFixed(2)
    row.querySelector('.line-total').innerHTML =
      '<strong>$' + lineTotal.toFixed(2) + '</strong>'
  }

  // Update all totals
  function updateTotals () {
    const tbody = document.getElementById('lineItemsBody')
    const taxRateInput = document.getElementById('taxRate')
    if (!tbody || !taxRateInput) return

    const taxRate = parseFloat(taxRateInput.value) / 100 || 0.0625
    let subtotal = 0
    let taxTotal = 0

    tbody.querySelectorAll('tr').forEach(row => {
      updateLineItemTotals(row)

      const quantity =
        parseFloat(row.querySelector('.quantity-input').value) || 0
      const unitPrice = parseFloat(row.querySelector('.price-input').value) || 0
      const taxable = row.querySelector('.taxable-checkbox').checked

      const lineSubtotal = quantity * unitPrice
      const lineTax = taxable ? lineSubtotal * taxRate : 0

      subtotal += lineSubtotal
      taxTotal += lineTax
    })

    const total = subtotal + taxTotal

    document.getElementById('previewSubtotal').textContent =
      '$' + subtotal.toFixed(2)
    document.getElementById('previewTaxTotal').textContent =
      '$' + taxTotal.toFixed(2)
    document.getElementById('previewTotal').textContent = '$' + total.toFixed(2)

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
