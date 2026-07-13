import { formatCurrency, renderStars, getLocalStorage, isAuthenticated, showLoginPrompt } from './utils.js';
import { addToCart } from './cart.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';

let productsList = [];

async function initWishlistPage() {
  if (!isAuthenticated()) {
    showLoginPrompt('wishlist');
    document.getElementById('wishlist-products-grid').innerHTML = '';
    document.getElementById('wishlist-empty-state').classList.remove('d-none');
    return;
  }

  try {
    const response = await fetch('./data/products.json');
    productsList = await response.json();
    renderWishlistProducts();
  } catch (error) {
    console.error('Failed to load wishlist page data:', error);
  }
}

function renderWishlistProducts() {
  const grid = document.getElementById('wishlist-products-grid');
  const emptyState = document.getElementById('wishlist-empty-state');

  if (!grid) return;

  const wishlistItems = getLocalStorage('wishlist', []);
  const savedProducts = productsList.filter((product) => wishlistItems.some((item) => item.id === product.id));

  if (wishlistItems.length > 0 && savedProducts.length === 0) {
    const legacyItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const migratedProducts = productsList.filter((product) => legacyItems.some((item) => item.id === product.id));
    if (migratedProducts.length > 0) {
      const currentUser = localStorage.getItem('vital-auth-user');
      if (currentUser) {
        localStorage.setItem(`wishlist:${JSON.parse(currentUser).email.toLowerCase()}`, JSON.stringify(legacyItems));
      }
      return renderWishlistProducts();
    }
  }

  if (savedProducts.length === 0) {
    emptyState?.classList.remove('d-none');
    grid.innerHTML = '';
    return;
  }

  emptyState?.classList.add('d-none');

  const html = savedProducts.map((product) => {
    const isSaved = isInWishlist(product.id);
    const wishlistIcon = isSaved ? 'bi-heart-fill' : 'bi-heart';
    const wishlistClass = isSaved ? 'product-wishlist-btn active' : 'product-wishlist-btn';
    const badgeHtml = product.badge ? `<span class="product-badge bg-${product.badgeType}">${product.badge}</span>` : '';
    const originalPriceHtml = product.originalPrice ? `<span class="original-price">${formatCurrency(product.originalPrice)}</span>` : '';

    return `
      <div class="col-xl-3 col-lg-4 col-md-6 col-sm-12" data-aos="fade-up">
        <div class="product-card">
          ${badgeHtml}
          <button class="${wishlistClass}" data-wishlist-id="${product.id}" aria-label="Remove from Wishlist">
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
              <button class="add-to-cart-circle btn-add-cart-fast" data-product-id="${product.id}" aria-label="Add ${product.name} to Cart">
                <i class="bi bi-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = html;

  grid.querySelectorAll('[data-wishlist-id]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const productId = btn.getAttribute('data-wishlist-id');
      const product = productsList.find((item) => item.id === productId);
      if (product) toggleWishlist(product);
      renderWishlistProducts();
    });
  });

  grid.querySelectorAll('[data-product-id]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const productId = btn.getAttribute('data-product-id');
      const product = productsList.find((item) => item.id === productId);
      if (product) addToCart(product, 1);
    });
  });
}

document.addEventListener('DOMContentLoaded', initWishlistPage);
window.addEventListener('authStateChanged', initWishlistPage);
