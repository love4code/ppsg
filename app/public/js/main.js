// Public site JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
    
    // Add affiliate text to footer
    addAffiliateText();
});

// Function to add affiliate text to footer (runs immediately and on DOM ready)
(function() {
    function addAffiliate() {
        const footer = document.querySelector('footer');
        if (footer) {
            const container = footer.querySelector('.container');
            if (container) {
                // Check if affiliate text already exists
                if (!container.querySelector('.affiliate-text')) {
                    const row = container.querySelector('.row');
                    if (row) {
                        // Create affiliate text element
                        const affiliateDiv = document.createElement('div');
                        affiliateDiv.className = 'col-12 mt-3 pt-3 border-top border-secondary affiliate-text';
                        affiliateDiv.style.textAlign = 'center';
                        affiliateDiv.style.fontSize = '0.875rem';
                        affiliateDiv.style.color = 'rgba(255, 255, 255, 0.7)';
                        affiliateDiv.textContent = 'Affiliate of Aquarian Pool and Spa';
                        row.appendChild(affiliateDiv);
                    }
                }
            }
        }
    }
    
    // Try immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addAffiliate);
    } else {
        addAffiliate();
    }
    
    // Also try after a short delay to ensure footer is loaded
    setTimeout(addAffiliate, 100);
    setTimeout(addAffiliate, 500);
})();

function addAffiliateText() {
    const footer = document.querySelector('footer');
    if (footer) {
        const container = footer.querySelector('.container');
        if (container) {
            if (!container.querySelector('.affiliate-text')) {
                const row = container.querySelector('.row');
                if (row) {
                    const affiliateDiv = document.createElement('div');
                    affiliateDiv.className = 'col-12 mt-3 pt-3 border-top border-secondary affiliate-text';
                    affiliateDiv.style.textAlign = 'center';
                    affiliateDiv.style.fontSize = '0.875rem';
                    affiliateDiv.style.color = 'rgba(255, 255, 255, 0.7)';
                    affiliateDiv.textContent = 'Affiliate of Aquarian Pool and Spa';
                    row.appendChild(affiliateDiv);
                }
            }
        }
    }
}

