/* Cart Page Controller & Global Operations Module */
import { getLocalStorage, setLocalStorage, formatCurrency, renderStars, showToast, isAuthenticated, showLoginPrompt } from './utils.js';
import { updateNavbarBadges } from './navbar.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';

let productsList = [];

/**
 * Initializes Cart Module and Page rendering.
 */
export async function initCartModule() {
  const isCartPage = window.location.pathname.includes('cart.html');
  
  if (isCartPage) {
    try {
      const res = await fetch('./data/products.json');
      productsList = await res.json();
      
      renderCartPage();
      renderRecommendedProducts();
      setupCouponHandler();
      
      // Bind proceed to checkout click
      const checkoutBtn = document.getElementById('btn-proceed-checkout');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
          const cart = getLocalStorage('cart', []);
          if (cart.length === 0) {
            e.preventDefault();
            showToast('Your shopping cart is empty!', 'warning');
          }
        });
      }
      
    } catch (e) {
      console.error('Failed to init cart page catalog:', e);
    }
  }
}

/**
 * Renders list rows and summary panels on cart page.
 */
export function renderCartPage() {
  const listContainer = document.getElementById('cart-items-list');
  const cardContainer = document.getElementById('cart-items-card');
  if (!listContainer) return;

  const cart = getLocalStorage('cart', []);

  if (cart.length === 0) {
    cardContainer.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x fs-1 text-muted"></i>
        <h3 class="mt-3 fw-bold">Your cart is empty</h3>
        <p class="text-secondary">Explore our premium catalog to add some items.</p>
        <a href="products.html" class="btn btn-primary-custom mt-2">Go Shopping</a>
      </div>
    `;
    updateTotals();
    renderSummaryPanel();
    return;
  }

  let html = '';

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    
    // Details details subtext
    let subtext = `Color: <span class="badge border" style="background-color:${item.selectedColor}; width:12px; height:12px; display:inline-block; vertical-align:middle; border-radius:50%; margin-left:3px;"></span>`;
    if (item.brand) subtext += ` | Brand: ${item.brand}`;

    html += `
      <div class="cart-item-row" data-index="${index}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="text-secondary uppercase" style="font-size:0.72rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">${item.category}</div>
          <a href="product.html?id=${item.id}" class="text-dark fw-bold text-decoration-none" style="font-size:1rem; display:block;">${item.name}</a>
          <small class="text-secondary" style="font-size:0.8rem; display:block; margin-top:2px;">${subtext}</small>
        </div>
        
        <!-- Quantity widget -->
        <div>
          <div class="cart-qty-selector">
            <button class="cart-qty-btn btn-cart-minus">-</button>
            <input type="text" class="cart-qty-input" value="${item.quantity}" readonly>
            <button class="cart-qty-btn btn-cart-plus">+</button>
          </div>
        </div>
        
        <!-- Total price -->
        <div class="text-end" style="min-width: 90px;">
          <div class="fw-bold text-dark font-weight-700" style="font-size:1.05rem;">${formatCurrency(itemTotal)}</div>
          <small class="text-secondary" style="font-size:0.78rem;">${formatCurrency(item.price)} each</small>
        </div>
        
        <!-- Remove button -->
        <button class="btn btn-link text-secondary p-0 btn-remove-item" aria-label="Remove Item">
          <i class="bi bi-trash fs-5"></i>
        </button>
      </div>
    `;
  });

  listContainer.innerHTML = html;
  bindCartRowEvents(listContainer);
  
  updateTotals();
  renderSummaryPanel();
}

/**
 * Attaches listeners for row clicks (Quantity adjust and item removals).
 */
function bindCartRowEvents(container) {
  let cart = getLocalStorage('cart', []);

  // Increment Quantity
  container.querySelectorAll('.btn-cart-plus').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      cart[idx].quantity += 1;
      setLocalStorage('cart', cart);
      renderCartPage();
      updateNavbarBadges();
    });
  });

  // Decrement Quantity
  container.querySelectorAll('.btn-cart-minus').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      if (cart[idx].quantity > 1) {
        cart[idx].quantity -= 1;
        setLocalStorage('cart', cart);
        renderCartPage();
        updateNavbarBadges();
      }
    });
  });

  // Remove Item
  container.querySelectorAll('.btn-remove-item').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const removedName = cart[idx].name;
      cart.splice(idx, 1);
      setLocalStorage('cart', cart);
      showToast(`Removed "${removedName}" from cart`, 'warning');
      renderCartPage();
      updateNavbarBadges();
    });
  });
}

/**
 * Populates prices inside order summary box.
 */
function renderSummaryPanel() {
  const totals = getLocalStorage('cart_totals', {
    subtotal: 0,
    discount: 0,
    couponDiscount: 0,
    shipping: 0,
    grandTotal: 0,
    couponCode: null
  });

  const subtotalSpan = document.getElementById('summary-subtotal');
  const discountRow = document.getElementById('summary-discount-row');
  const discountSpan = document.getElementById('summary-discount');
  const promoRow = document.getElementById('summary-promo-row');
  const promoSpan = document.getElementById('summary-promo');
  const shippingSpan = document.getElementById('summary-shipping');
  const grandTotalSpan = document.getElementById('summary-grand-total');

  if (subtotalSpan) subtotalSpan.textContent = formatCurrency(totals.subtotal);
  
  // Base original price discount subtraction savings
  const baseSavings = totals.discount - totals.couponDiscount;
  if (baseSavings > 0) {
    if (discountRow) discountRow.style.display = 'flex';
    if (discountSpan) discountSpan.textContent = `-${formatCurrency(baseSavings)}`;
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  // Coupon Promo Code discount
  if (totals.couponDiscount > 0) {
    if (promoRow) promoRow.style.display = 'flex';
    if (promoSpan) promoSpan.textContent = `-${formatCurrency(totals.couponDiscount)}`;
  } else {
    if (promoRow) promoRow.style.display = 'none';
  }

  // Shipping
  if (shippingSpan) {
    shippingSpan.textContent = totals.shipping > 0 ? formatCurrency(totals.shipping) : 'Free';
  }

  // Grand Total
  if (grandTotalSpan) {
    grandTotalSpan.textContent = formatCurrency(totals.grandTotal);
  }

  // Update status messages inside Coupon Box if coupon applied
  const statusMsg = document.getElementById('coupon-status-msg');
  const couponInput = document.getElementById('coupon-input');
  if (statusMsg) {
    if (totals.couponCode) {
      statusMsg.textContent = `Coupon "${totals.couponCode}" active (20% Off subtotal)`;
      statusMsg.className = 'mt-2 text-success';
      if (couponInput) couponInput.value = totals.couponCode;
    } else {
      statusMsg.textContent = '';
      if (couponInput) couponInput.value = '';
    }
  }
}

/**
 * Handles Coupon Form interactions.
 */
function setupCouponHandler() {
  const applyBtn = document.getElementById('btn-apply-coupon');
  const couponInput = document.getElementById('coupon-input');
  const statusMsg = document.getElementById('coupon-status-msg');
  if (!applyBtn || !couponInput) return;

  applyBtn.addEventListener('click', () => {
    const code = couponInput.value.trim().toUpperCase();
    const cart = getLocalStorage('cart', []);
    
    if (cart.length === 0) {
      showToast('Add items before applying codes!', 'warning');
      return;
    }

    if (code === 'VITAL20') {
      setLocalStorage('active_coupon', code);
      showToast('Coupon VITAL20 applied successfully! 20% discount added.', 'success');
      renderCartPage();
    } else if (!code) {
      setLocalStorage('active_coupon', null);
      showToast('Coupon cleared', 'info');
      renderCartPage();
    } else {
      if (statusMsg) {
        statusMsg.textContent = 'Invalid promo code. Try "VITAL20"';
        statusMsg.className = 'mt-2 text-danger';
      }
      showToast('Invalid coupon code.', 'danger');
    }
  });
}

function renderRecommendedProducts() {
  const container = document.getElementById('cart-recommended-products');
  if (!container) return;

  // Render 4 products
  const items = productsList.slice(2, 6);
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
      if (prod) {
        addToCart(prod, 1);
        renderCartPage();
      }
    });
  });
}

/**
 * Adds an item to the cart.
 */
export function addToCart(product, quantity = 1, selectedColor = null) {
  if (!product || !product.id) return;

  if (!isAuthenticated()) {
    showLoginPrompt('cart');
    return;
  }

  let cart = getLocalStorage('cart', []);
  
  const existingItemIndex = cart.findIndex(item => 
    item.id === product.id && item.selectedColor === selectedColor
  );
  
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
    showToast(`Updated quantity of "${product.name}" in cart`, 'success');
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      image: product.image,
      quantity: quantity,
      selectedColor: selectedColor || (product.colors && product.colors[0]) || null,
      brand: product.brand
    });
    showToast(`Added "${product.name}" to cart`, 'success');
  }
  
  setLocalStorage('cart', cart);
  updateTotals();
  updateNavbarBadges();
  
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

/**
 * Calculates subtotals and updates cart summary in LocalStorage.
 */
export function updateTotals() {
  const cart = getLocalStorage('cart', []);
  
  let subtotal = 0;
  let totalDiscount = 0;
  
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    if (item.originalPrice && item.originalPrice > item.price) {
      totalDiscount += (item.originalPrice - item.price) * item.quantity;
    }
  });
  
  const shippingThreshold = 50.00;
  const shippingCharge = 9.99;
  const shipping = (subtotal >= shippingThreshold || subtotal === 0) ? 0 : shippingCharge;
  
  const discountCode = getLocalStorage('active_coupon', null);
  let promoDiscount = 0;
  if (discountCode === 'VITAL20') {
    promoDiscount = subtotal * 0.2;
  }
  
  const grandTotal = subtotal - promoDiscount + shipping;
  
  const totals = {
    subtotal: subtotal,
    discount: totalDiscount + promoDiscount,
    couponDiscount: promoDiscount,
    shipping: shipping,
    grandTotal: grandTotal,
    couponCode: discountCode
  };
  
  setLocalStorage('cart_totals', totals);
}

// Initialise page on script load
document.addEventListener('DOMContentLoaded', () => {
  initCartModule();
});
