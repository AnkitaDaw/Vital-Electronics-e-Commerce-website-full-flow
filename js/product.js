/* Product Detail Page Dynamic Loader Module */
import { formatCurrency, renderStars, getLocalStorage, setLocalStorage, showToast } from './utils.js';
import { addToCart } from './cart.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';

let productsList = [];
let currentProduct = null;
let selectedColor = null;

/**
 * Main initialization on DOM Load.
 */
export async function initProductDetails() {
  try {
    const response = await fetch('./data/products.json');
    productsList = await response.json();
    
    // Parse URL parameter ?id=...
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    
    if (!productId) {
      renderNotFoundError();
      return;
    }
    
    currentProduct = productsList.find(p => p.id === productId);
    
    if (!currentProduct) {
      renderNotFoundError();
      return;
    }
    
    // Render product details
    renderProductMainInfo();
    setupGalleryZoom();
    setupColorsSelector();
    setupWarrantySelector();
    setupQuantitySelector();
    setupTabDetails();
    setupMockReviews();
    renderRelatedProducts();
    
    // Track and render recently viewed
    trackRecentlyViewed();
    renderRecentlyViewed();
    
    // Bind main action clicks
    bindActionButtons();
    
  } catch (error) {
    console.error('Failed to initialize product details page:', error);
    renderNotFoundError();
  }
}

function renderNotFoundError() {
  const container = document.getElementById('pdp-container');
  if (container) {
    container.innerHTML = `
      <div class="row text-center py-5">
        <div class="col-12">
          <i class="bi bi-exclamation-triangle fs-1 text-danger"></i>
          <h2 class="mt-3 fw-bold">Product Not Found</h2>
          <p class="text-secondary">We couldn't find the product you were looking for. It may have been removed or the link is incorrect.</p>
          <a href="products.html" class="btn btn-primary-custom mt-3">Back to Shop</a>
        </div>
      </div>
    `;
  }
}

function renderProductMainInfo() {
  document.title = `${currentProduct.name} - Vital Electronics`;
  
  // Breadcrumb
  const breadcrumbName = document.getElementById('breadcrumb-product-name');
  if (breadcrumbName) breadcrumbName.textContent = currentProduct.name;
  
  // Title & Category
  const catBadge = document.getElementById('pdp-category');
  if (catBadge) {
    catBadge.textContent = currentProduct.category;
    catBadge.parentElement.setAttribute('href', `products.html?category=${encodeURIComponent(currentProduct.category)}`);
  }
  
  const nameHeader = document.getElementById('pdp-product-name');
  if (nameHeader) nameHeader.textContent = currentProduct.name;
  
  // Star rating
  const starsSpan = document.getElementById('pdp-stars');
  if (starsSpan) starsSpan.innerHTML = renderStars(currentProduct.rating);
  
  const countSpan = document.getElementById('pdp-reviews-count');
  if (countSpan) countSpan.textContent = `(${currentProduct.reviewsCount} Customer Reviews)`;
  
  // Badges
  const badgeSpan = document.getElementById('pdp-badge');
  if (badgeSpan) {
    if (currentProduct.badge) {
      badgeSpan.textContent = currentProduct.badge;
      badgeSpan.className = `badge bg-${currentProduct.badgeType} text-white px-2 py-1`;
      badgeSpan.style.display = 'inline-block';
    } else {
      badgeSpan.style.display = 'none';
    }
  }

  // Stock
  const stockSpan = document.getElementById('pdp-stock-status');
  if (stockSpan) {
    if (currentProduct.stockStatus === 'in-stock') {
      stockSpan.textContent = 'In Stock';
      stockSpan.className = 'text-success font-weight-600';
    } else if (currentProduct.stockStatus === 'low-stock') {
      stockSpan.textContent = 'Low Stock';
      stockSpan.className = 'text-warning font-weight-600';
    } else {
      stockSpan.textContent = 'Out of Stock';
      stockSpan.className = 'text-danger font-weight-600';
      // Disable add to cart button
      const cartBtn = document.getElementById('btn-pdp-add-cart');
      if (cartBtn) {
        cartBtn.disabled = true;
        cartBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i> Out of Stock';
      }
    }
  }

  // Prices
  const priceSpan = document.getElementById('pdp-price');
  if (priceSpan) priceSpan.textContent = formatCurrency(currentProduct.price);
  
  const originalPriceSpan = document.getElementById('pdp-original-price');
  const discountBadge = document.getElementById('pdp-discount-badge');
  
  if (currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price) {
    if (originalPriceSpan) {
      originalPriceSpan.textContent = formatCurrency(currentProduct.originalPrice);
      originalPriceSpan.style.display = 'inline-block';
    }
    if (discountBadge) {
      const savings = currentProduct.originalPrice - currentProduct.price;
      discountBadge.textContent = `Save ${formatCurrency(savings)}`;
      discountBadge.style.display = 'inline-block';
    }
  } else {
    if (originalPriceSpan) originalPriceSpan.style.display = 'none';
    if (discountBadge) discountBadge.style.display = 'none';
  }
  
  // Description
  const shortDesc = document.getElementById('pdp-short-desc');
  if (shortDesc) shortDesc.textContent = currentProduct.description;
  
  // Images Gallery
  const mainImg = document.getElementById('pdp-main-image');
  if (mainImg) {
    mainImg.src = currentProduct.image;
    mainImg.alt = currentProduct.name;
  }
  
  // Generate Thumbnails
  const thumbList = document.getElementById('pdp-thumbnail-list');
  if (thumbList) {
    const images = Array.isArray(currentProduct.gallery) && currentProduct.gallery.length
      ? currentProduct.gallery
      : [currentProduct.image];

    let html = '';
    images.forEach((imgSrc, idx) => {
      const activeClass = idx === 0 ? 'active' : '';
      const normalizedSrc = imgSrc || currentProduct.image;
      html += `
        <div class="thumbnail-item ${activeClass}" data-image-src="${normalizedSrc}">
          <img src="${normalizedSrc}" alt="${currentProduct.name} View ${idx + 1}">
        </div>
      `;
    });
    thumbList.innerHTML = html;

    // Bind thumbnail clicks
    thumbList.querySelectorAll('.thumbnail-item').forEach(item => {
      item.addEventListener('click', () => {
        thumbList.querySelectorAll('.thumbnail-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const newSrc = item.getAttribute('data-image-src');
        if (mainImg) {
          mainImg.src = newSrc;
          mainImg.alt = currentProduct.name;
        }
      });
    });
  }

  // Sync Wishlist Button Status
  const wishlistBtn = document.getElementById('btn-pdp-wishlist');
  if (wishlistBtn) {
    const isSaved = isInWishlist(currentProduct.id);
    if (isSaved) {
      wishlistBtn.innerHTML = '<i class="bi bi-heart-fill"></i>';
      wishlistBtn.style.color = 'var(--color-danger)';
    } else {
      wishlistBtn.innerHTML = '<i class="bi bi-heart"></i>';
      wishlistBtn.style.color = '#4B5563';
    }
  }
}

/**
 * Implements mouse-hover zoom magnification.
 */
function setupGalleryZoom() {
  const container = document.getElementById('pdp-gallery-main');
  const img = document.getElementById('pdp-main-image');
  if (!container || !img) return;

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    img.style.transform = 'scale(1.5)';
  });

  container.addEventListener('mouseleave', () => {
    img.style.transformOrigin = 'center center';
    img.style.transform = 'scale(1)';
  });
}

function setupColorsSelector() {
  const container = document.getElementById('pdp-colors-container');
  if (!container || !currentProduct.colors) return;

  const availableColors = currentProduct.colors.slice(0, 1);
  const unavailableColors = currentProduct.colors.slice(1);
  const allVariants = [
    ...availableColors.map(color => ({ color, available: true })),
    ...unavailableColors.map(color => ({ color, available: false }))
  ];

  let html = '';
  allVariants.forEach((variant, idx) => {
    const activeClass = idx === 0 ? 'active' : '';
    const disabledClass = variant.available ? '' : 'variant-circle-disabled';
    const title = variant.available ? 'Available color option' : 'Currently unavailable';
    if (idx === 0) selectedColor = variant.color;

    html += `
      <span class="variant-circle ${activeClass} ${disabledClass}" data-color="${variant.color}" data-available="${variant.available}" style="background-color:${variant.color};" title="${title}" role="button" tabindex="${variant.available ? '0' : '-1'}" aria-label="${title}"></span>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.variant-circle').forEach(circle => {
    const isAvailable = circle.getAttribute('data-available') === 'true';

    if (!isAvailable) {
      circle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      return;
    }

    circle.addEventListener('click', () => {
      container.querySelectorAll('.variant-circle').forEach(c => c.classList.remove('active'));
      circle.classList.add('active');
      selectedColor = circle.getAttribute('data-color');
    });

    circle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        container.querySelectorAll('.variant-circle').forEach(c => c.classList.remove('active'));
        circle.classList.add('active');
        selectedColor = circle.getAttribute('data-color');
      }
    });
  });
}

function setupWarrantySelector() {
  const container = document.getElementById('pdp-warranty-container');
  if (!container) return;
  
  const options = container.querySelectorAll('.warranty-option');
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      opt.querySelector('input[type="radio"]').checked = true;
    });
  });
}

function setupQuantitySelector() {
  const countInput = document.getElementById('qty-count-input');
  const plusBtn = document.getElementById('btn-qty-plus');
  const minusBtn = document.getElementById('btn-qty-minus');
  if (!countInput || !plusBtn || !minusBtn) return;
  
  plusBtn.addEventListener('click', () => {
    let val = parseInt(countInput.value) || 1;
    if (val < 99) countInput.value = val + 1;
  });
  
  minusBtn.addEventListener('click', () => {
    let val = parseInt(countInput.value) || 1;
    if (val > 1) countInput.value = val - 1;
  });
}

function setupTabDetails() {
  // Full Description
  const fullDesc = document.getElementById('pdp-full-desc');
  if (fullDesc) fullDesc.textContent = currentProduct.description;
  
  // Specs Table
  const specsTable = document.getElementById('pdp-specs-table');
  if (specsTable && currentProduct.specs) {
    let html = '';
    Object.entries(currentProduct.specs).forEach(([key, val]) => {
      html += `
        <tr>
          <td class="fw-bold font-weight-700" style="width: 30%;">${key}</td>
          <td class="text-secondary">${val}</td>
        </tr>
      `;
    });
    specsTable.innerHTML = html;
  }
}

function setupMockReviews() {
  const avgText = document.getElementById('pdp-review-avg');
  const avgStars = document.getElementById('pdp-review-avg-stars');
  const avgCount = document.getElementById('pdp-review-avg-count');
  const listContainer = document.getElementById('pdp-reviews-list');
  
  if (avgText) avgText.textContent = currentProduct.rating.toFixed(1);
  if (avgStars) avgStars.innerHTML = renderStars(currentProduct.rating);
  if (avgCount) avgCount.textContent = `Based on ${currentProduct.reviewsCount} customer reviews`;
  
  if (listContainer) {
    // Generate 3 mock review entries
    const reviews = [
      {
        user: "Sarah K.",
        stars: 5,
        date: "June 25, 2026",
        content: `Outstanding product. The build quality exceeds my expectations. Fits perfectly in my daily setup. Highly recommended!`
      },
      {
        user: "Thomas M.",
        stars: 4,
        date: "May 14, 2026",
        content: `Very functional and behaves exactly as advertised. Delivered fast. Standard battery life could be slightly better, but charging is fast.`
      },
      {
        user: "Jessica L.",
        stars: 5,
        date: "April 02, 2026",
        content: `Extremely satisfied with this purchase. Outstanding customer support and quick checkout. Best value in the category!`
      }
    ];
    
    let html = '';
    reviews.forEach(r => {
      html += `
        <div class="mb-4 pb-4 border-bottom">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <span class="font-weight-700 text-dark block fs-6" style="display:block;">${r.user}</span>
              <span class="rating-stars">${renderStars(r.stars)}</span>
            </div>
            <small class="text-muted">${r.date}</small>
          </div>
          <p class="text-secondary mb-0" style="font-size:0.92rem;">"${r.content}"</p>
        </div>
      `;
    });
    listContainer.innerHTML = html;
  }
}

function renderRelatedProducts() {
  const container = document.getElementById('pdp-related-products');
  if (!container) return;
  
  const related = productsList.filter(p => 
    p.category === currentProduct.category && p.id !== currentProduct.id
  ).slice(0, 4);
  
  // Fallback to top products if no related category item
  const items = related.length > 0 ? related : productsList.slice(0, 4);
  let html = '';
  
  items.forEach((product, index) => {
    const isSaved = isInWishlist(product.id);
    const wishlistIcon = isSaved ? 'bi-heart-fill' : 'bi-heart';
    const wishlistClass = isSaved ? 'product-wishlist-btn active' : 'product-wishlist-btn';
    const badgeHtml = product.badge ? `<span class="product-badge bg-${product.badgeType}">${product.badge}</span>` : '';
    const originalPriceHtml = product.originalPrice ? `<span class="original-price">${formatCurrency(product.originalPrice)}</span>` : '';

    html += `
      <div class="col-lg-3 col-md-6 col-sm-12" data-aos="fade-up">
        <div class="product-card">
          ${badgeHtml}
          <button class="${wishlistClass}" data-wishlist-id="${product.id}" aria-label="Add to Wishlist">
            <i class="bi ${wishlistIcon}"></i>
          </button>
          <a href="product.html?id=${product.id}" class="product-image-wrapper">
            <img src="${product.image}" alt="${product.name}" class="product-card-img" loading="lazy">
          </a>
          <div class="product-details">
            <div class="product-category">${product.category}</div>
            <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
            <div class="product-rating">
              <span class="rating-stars">${renderStars(product.rating)}</span>
              <span class="rating-count">(${product.reviewsCount})</span>
            </div>
            <div class="product-price-row">
              <div class="price-container">
                <span class="current-price">${formatCurrency(product.price)}</span>
                ${originalPriceHtml}
              </div>
              <button class="add-to-cart-circle btn-add-cart-fast" data-product-id="${product.id}">
                <i class="bi bi-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Bind click
  container.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-wishlist-id');
      const prod = productsList.find(p => p.id === id);
      if (prod) toggleWishlist(prod);
    });
  });

  container.querySelectorAll('[data-product-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-product-id');
      const prod = productsList.find(p => p.id === id);
      if (prod) addToCart(prod, 1);
    });
  });
}

/* =========================================================================
   RECENTLY VIEWED ENGINE
   ========================================================================= */

function trackRecentlyViewed() {
  let list = getLocalStorage('recently_viewed', []);
  
  // Remove existing entry and push to front
  list = [currentProduct.id, ...list.filter(id => id !== currentProduct.id)].slice(0, 4);
  setLocalStorage('recently_viewed', list);
}

function renderRecentlyViewed() {
  const section = document.getElementById('pdp-recent-section');
  const container = document.getElementById('pdp-recent-products');
  if (!section || !container) return;
  
  const viewedIds = getLocalStorage('recently_viewed', []);
  // Exclude current item
  const filteredIds = viewedIds.filter(id => id !== currentProduct.id);
  
  if (filteredIds.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  const items = productsList.filter(p => filteredIds.includes(p.id)).slice(0, 4);
  
  if (items.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  
  let html = '';
  items.forEach(product => {
    const isSaved = isInWishlist(product.id);
    const wishlistIcon = isSaved ? 'bi-heart-fill' : 'bi-heart';
    const wishlistClass = isSaved ? 'product-wishlist-btn active' : 'product-wishlist-btn';
    const badgeHtml = product.badge ? `<span class="product-badge bg-${product.badgeType}">${product.badge}</span>` : '';
    const originalPriceHtml = product.originalPrice ? `<span class="original-price">${formatCurrency(product.originalPrice)}</span>` : '';

    html += `
      <div class="col-lg-3 col-md-6 col-sm-12" data-aos="fade-up">
        <div class="product-card">
          ${badgeHtml}
          <button class="${wishlistClass}" data-wishlist-id="${product.id}" aria-label="Add to Wishlist">
            <i class="bi ${wishlistIcon}"></i>
          </button>
          <a href="product.html?id=${product.id}" class="product-image-wrapper">
            <img src="${product.image}" alt="${product.name}" class="product-card-img" loading="lazy">
          </a>
          <div class="product-details">
            <div class="product-category">${product.category}</div>
            <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
            <div class="product-rating">
              <span class="rating-stars">${renderStars(product.rating)}</span>
              <span class="rating-count">(${product.reviewsCount})</span>
            </div>
            <div class="product-price-row">
              <div class="price-container">
                <span class="current-price">${formatCurrency(product.price)}</span>
                ${originalPriceHtml}
              </div>
              <button class="add-to-cart-circle btn-add-cart-fast" data-product-id="${product.id}">
                <i class="bi bi-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Bind actions
  container.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-wishlist-id');
      const prod = productsList.find(p => p.id === id);
      if (prod) toggleWishlist(prod);
    });
  });

  container.querySelectorAll('[data-product-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-product-id');
      const prod = productsList.find(p => p.id === id);
      if (prod) addToCart(prod, 1);
    });
  });
}

function bindActionButtons() {
  // Cart Trigger
  const cartBtn = document.getElementById('btn-pdp-add-cart');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      const qtyInput = document.getElementById('qty-count-input');
      const qty = parseInt(qtyInput.value) || 1;
      
      // Extended Warranty Check
      const selectedWarrantyRadio = document.querySelector('input[name="warranty"]:checked');
      const warrantyType = selectedWarrantyRadio ? selectedWarrantyRadio.value : 'basic';
      
      // Construct item adjustments if warranty added
      let adjustedPrice = currentProduct.price;
      let warrantyText = '';
      
      if (warrantyType === 'extended-2') {
        adjustedPrice += 19.99;
        warrantyText = ' + 2 Yr Extended Warranty';
      } else if (warrantyType === 'extended-3') {
        adjustedPrice += 39.99;
        warrantyText = ' + 3 Yr Protection';
      }
      
      const customProduct = {
        ...currentProduct,
        price: adjustedPrice,
        name: currentProduct.name + warrantyText
      };
      
      addToCart(customProduct, qty, selectedColor);
    });
  }
  
  // Wishlist Toggle Trigger
  const wishlistBtn = document.getElementById('btn-pdp-wishlist');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      toggleWishlist(currentProduct);
      const isSaved = isInWishlist(currentProduct.id);
      if (isSaved) {
        wishlistBtn.innerHTML = '<i class="bi bi-heart-fill"></i>';
        wishlistBtn.style.color = 'var(--color-danger)';
      } else {
        wishlistBtn.innerHTML = '<i class="bi bi-heart"></i>';
        wishlistBtn.style.color = '#4B5563';
      }
    });
  }

  // Comparison toggle
  const compareBtn = document.getElementById('btn-pdp-compare');
  if (compareBtn) {
    compareBtn.addEventListener('click', () => {
      let compareList = getLocalStorage('compare_list', []);
      if (compareList.includes(currentProduct.id)) {
        compareList = compareList.filter(id => id !== currentProduct.id);
        setLocalStorage('compare_list', compareList);
        showToast(`Removed "${currentProduct.name}" from comparisons list`, 'info');
      } else {
        compareList.push(currentProduct.id);
        setLocalStorage('compare_list', compareList);
        showToast(`Added "${currentProduct.name}" to comparisons list`, 'success');
      }
    });
  }

  // Share overlay
  const shareBtn = document.getElementById('btn-pdp-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const shareInput = document.getElementById('share-link-input');
      if (shareInput) {
        shareInput.value = window.location.href;
      }
      // Trigger bootstrap share modal
      const modalElement = document.getElementById('shareProductModal');
      if (modalElement && typeof bootstrap !== 'undefined') {
        const myModal = new bootstrap.Modal(modalElement);
        myModal.show();
      }
    });
  }

  // Copy link action inside share modal
  const copyBtn = document.getElementById('btn-copy-share-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const shareInput = document.getElementById('share-link-input');
      if (shareInput) {
        shareInput.select();
        navigator.clipboard.writeText(shareInput.value).then(() => {
          showToast('Product link copied to clipboard!', 'success');
          // Close modal
          const modalElement = document.getElementById('shareProductModal');
          const modalInstance = bootstrap.Modal.getInstance(modalElement);
          if (modalInstance) modalInstance.hide();
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    });
  }
}

// Start
document.addEventListener('DOMContentLoaded', initProductDetails);
