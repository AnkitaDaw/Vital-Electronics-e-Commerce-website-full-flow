/* Products Listing, Filtering, and Rendering Engine */
import { formatCurrency, renderStars, getLocalStorage } from './utils.js';
import { addToCart } from './cart.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';

let productsList = [];

// Shared Filter & Pagination State
const filterState = {
  category: 'all',
  price: 'all',
  badge: 'all',
  brands: [],
  ratings: [],
  colors: [],
  inStockOnly: false,
  searchQuery: '',
  wishlistOnly: false,
  sort: 'popular',
  layout: 'grid',
  currentPage: 1,
  itemsPerPage: 6
};

/**
 * Loads products.json and starts rendering sections.
 */
export async function initProductsModule() {
  try {
    const response = await fetch('./data/products.json');
    productsList = await response.json();

    // Check which page we are on
    const isPLP = window.location.pathname.includes('products.html');

    if (isPLP) {
      initProductListingPage();
    } else {
      renderFeaturedProducts();
      renderBestSellers();
    }
  } catch (error) {
    console.error('Failed to load products list:', error);
  }
}

/* =========================================================================
   LANDING PAGE RENDERERS
   ========================================================================= */

function renderFeaturedProducts() {
  const grid = document.getElementById('featured-products-grid');
  if (!grid) return;

  const featured = productsList.slice(0, 6);
  let html = '';

  featured.forEach((product, index) => {
    const isSaved = isInWishlist(product.id);
    const wishlistIcon = isSaved ? 'bi-heart-fill' : 'bi-heart';
    const wishlistClass = isSaved ? 'product-wishlist-btn active' : 'product-wishlist-btn';
    const badgeHtml = product.badge ? `<span class="product-badge bg-${product.badgeType}">${product.badge}</span>` : '';
    const originalPriceHtml = product.originalPrice ? `<span class="original-price">${formatCurrency(product.originalPrice)}</span>` : '';

    html += `
      <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12" data-aos="fade-up" data-aos-delay="${index * 100}">
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
              <button class="add-to-cart-circle btn-add-cart-fast" data-product-id="${product.id}" aria-label="Add ${product.name} to Cart">
                <i class="bi bi-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
  bindProductCardEvents(grid);
}

function renderBestSellers() {
  const grid = document.getElementById('best-sellers-grid');
  if (!grid) return;

  const bestSellers = productsList.filter(p =>
    ['vital-noisex-pro', 'vital-smart-watch', 'vital-earbuds-pro', 'vital-power-bank-20k'].includes(p.id)
  ).slice(0, 4);

  const items = bestSellers.length === 4 ? bestSellers : productsList.slice(6, 10);
  let html = '';

  items.forEach((product, index) => {
    const isSaved = isInWishlist(product.id);
    const wishlistIcon = isSaved ? 'bi-heart-fill' : 'bi-heart';
    const wishlistClass = isSaved ? 'product-wishlist-btn active' : 'product-wishlist-btn';
    const badgeHtml = product.badge ? `<span class="product-badge bg-${product.badgeType}">${product.badge}</span>` : '';
    const originalPriceHtml = product.originalPrice ? `<span class="original-price">${formatCurrency(product.originalPrice)}</span>` : '';

    html += `
      <div class="col-lg-3 col-md-6 col-sm-12" data-aos="fade-up" data-aos-delay="${index * 100}">
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
            <div class="price-container mb-3">
              <span class="current-price">${formatCurrency(product.price)}</span>
              ${originalPriceHtml}
            </div>
            <div class="best-seller-btn-wrap mt-auto">
              <button class="btn btn-outline-primary-custom btn-best-seller btn-add-cart-full" data-product-id="${product.id}">
                <i class="bi bi-cart3"></i> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
  bindProductCardEvents(grid);
}

/* =========================================================================
   PRODUCT LISTING PAGE ENGINE (PLP)
   ========================================================================= */

function initProductListingPage() {
  // Parse search params
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('category');
  const badgeParam = params.get('badge');
  const searchParam = params.get('search');
  const wishlistParam = params.get('wishlist');

  if (catParam) {
    filterState.category = catParam;
    // Set checked state in category radios
    const categoryRadios = document.querySelectorAll('input[name="category-filter"]');
    categoryRadios.forEach(radio => {
      if (radio.value === catParam) radio.checked = true;
    });
  }

  if (badgeParam) {
    const normalizedBadge = badgeParam.toUpperCase();

    if (normalizedBadge === 'DEAL') {
      filterState.price = 'under-50';
      filterState.badge = 'DEAL';
    } else if (normalizedBadge === 'NEW') {
      filterState.badge = 'NEW';
    } else if (normalizedBadge === 'BEST SELLER') {
      filterState.badge = 'BEST SELLER';
    }

    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) {
      if (normalizedBadge === 'NEW') {
        breadcrumbCurrent.textContent = 'New Arrivals';
      } else if (normalizedBadge === 'BEST SELLER') {
        breadcrumbCurrent.textContent = 'Best Sellers';
      }
    }
  }

  if (searchParam) {
    filterState.searchQuery = searchParam;
    const globalInput = document.getElementById('global-search-input');
    if (globalInput) globalInput.value = searchParam;
  }

  if (wishlistParam === 'true') {
    filterState.wishlistOnly = true;
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Wishlist';
  }

  // Render filter items dynamically
  renderBrandFilters();
  setupFilterEventListeners();

  // Mobile Offcanvas content syncing
  const offcanvasBody = document.getElementById('offcanvas-filters-body');
  const sidebarContent = document.querySelector('aside[role="complementary"]');
  if (offcanvasBody && sidebarContent) {
    offcanvasBody.innerHTML = sidebarContent.innerHTML;
    // Rebind listeners on offcanvas elements too
    setupOffcanvasEventListeners(offcanvasBody);
  }

  // Render listing catalog
  applyFiltersAndRender();
}

/**
 * Renders brand filter checkboxes dynamically based on catalog brands.
 */
function renderBrandFilters() {
  const container = document.getElementById('filter-brands-container');
  if (!container) return;

  const brands = [...new Set(productsList.map(p => p.brand))];
  let html = '';
  brands.forEach(brand => {
    html += `
      <label class="filter-option">
        <input type="checkbox" name="brand-filter" value="${brand}">
        <span>${brand}</span>
      </label>
    `;
  });
  container.innerHTML = html;
}

/**
 * Binds DOM event listeners on the sidebar controls.
 */
function setupFilterEventListeners() {
  // Category Selection
  const categoryRadios = document.querySelectorAll('input[name="category-filter"]');
  categoryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      filterState.category = radio.value;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // Price Selection
  const priceRadios = document.querySelectorAll('input[name="price-filter"]');
  priceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      filterState.price = radio.value;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // Brand Checkboxes
  const container = document.getElementById('filter-brands-container');
  if (container) {
    container.addEventListener('change', (e) => {
      if (e.target.name === 'brand-filter') {
        const checked = Array.from(container.querySelectorAll('input[name="brand-filter"]:checked')).map(cb => cb.value);
        filterState.brands = checked;
        filterState.currentPage = 1;
        applyFiltersAndRender();
      }
    });
  }

  // Ratings checkboxes
  const ratingCheckboxes = document.querySelectorAll('input[name="rating-filter"]');
  ratingCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const checked = Array.from(document.querySelectorAll('input[name="rating-filter"]:checked')).map(c => parseFloat(c.value));
      filterState.ratings = checked;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // Colors dots
  const colorDots = document.querySelectorAll('.color-dot-filter');
  colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const color = dot.getAttribute('data-color');
      if (dot.classList.contains('active')) {
        dot.classList.remove('active');
        filterState.colors = filterState.colors.filter(c => c !== color);
      } else {
        dot.classList.add('active');
        filterState.colors.push(color);
      }
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // Availability stock checkbox
  const stockCheckbox = document.querySelector('input[name="stock-filter"]');
  if (stockCheckbox) {
    stockCheckbox.addEventListener('change', () => {
      filterState.inStockOnly = stockCheckbox.checked;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  }

  // Sorting Choice
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      filterState.sort = sortSelect.value;
      applyFiltersAndRender();
    });
  }

  // Layout View Toggles
  const gridBtn = document.getElementById('btn-layout-grid');
  const listBtn = document.getElementById('btn-layout-list');

  if (gridBtn && listBtn) {
    gridBtn.addEventListener('click', () => {
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
      filterState.layout = 'grid';
      applyFiltersAndRender();
    });
    listBtn.addEventListener('click', () => {
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
      filterState.layout = 'list';
      applyFiltersAndRender();
    });
  }

  // Clear All
  const clearBtn = document.getElementById('btn-clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      resetFilters();
    });
  }
}

/**
 * Rebinds events on mobile offcanvas sidebar copy.
 */
function setupOffcanvasEventListeners(offcanvasBody) {
  // Sync elements Category
  offcanvasBody.querySelectorAll('input[name="category-filter"]').forEach(radio => {
    radio.addEventListener('change', () => {
      filterState.category = radio.value;
      filterState.currentPage = 1;
      // Sync desktop input
      const desktopRadio = document.querySelector(`aside[role="complementary"] input[name="category-filter"][value="${radio.value}"]`);
      if (desktopRadio) desktopRadio.checked = true;
      applyFiltersAndRender();
    });
  });

  // Price Range
  offcanvasBody.querySelectorAll('input[name="price-filter"]').forEach(radio => {
    radio.addEventListener('change', () => {
      filterState.price = radio.value;
      filterState.currentPage = 1;
      const desktopRadio = document.querySelector(`aside[role="complementary"] input[name="price-filter"][value="${radio.value}"]`);
      if (desktopRadio) desktopRadio.checked = true;
      applyFiltersAndRender();
    });
  });

  // Brands
  offcanvasBody.querySelectorAll('input[name="brand-filter"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const desktopCb = document.querySelector(`aside[role="complementary"] input[name="brand-filter"][value="${cb.value}"]`);
      if (desktopCb) desktopCb.checked = cb.checked;

      const allChecked = Array.from(offcanvasBody.querySelectorAll('input[name="brand-filter"]:checked')).map(c => c.value);
      filterState.brands = allChecked;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // Ratings
  offcanvasBody.querySelectorAll('input[name="rating-filter"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const desktopCb = document.querySelector(`aside[role="complementary"] input[name="rating-filter"][value="${cb.value}"]`);
      if (desktopCb) desktopCb.checked = cb.checked;

      const allChecked = Array.from(offcanvasBody.querySelectorAll('input[name="rating-filter"]:checked')).map(c => parseFloat(c.value));
      filterState.ratings = allChecked;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // Colors dots
  offcanvasBody.querySelectorAll('.color-dot-filter').forEach(dot => {
    dot.addEventListener('click', () => {
      const color = dot.getAttribute('data-color');
      const desktopDot = document.querySelector(`aside[role="complementary"] .color-dot-filter[data-color="${color}"]`);

      if (dot.classList.contains('active')) {
        dot.classList.remove('active');
        if (desktopDot) desktopDot.classList.remove('active');
        filterState.colors = filterState.colors.filter(c => c !== color);
      } else {
        dot.classList.add('active');
        if (desktopDot) desktopDot.classList.add('active');
        filterState.colors.push(color);
      }
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // Stock
  const stockCb = offcanvasBody.querySelector('input[name="stock-filter"]');
  if (stockCb) {
    stockCb.addEventListener('change', () => {
      filterState.inStockOnly = stockCb.checked;
      const desktopCb = document.querySelector('aside[role="complementary"] input[name="stock-filter"]');
      if (desktopCb) desktopCb.checked = stockCb.checked;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  }

  // Clear button
  const clearBtn = offcanvasBody.querySelector('#btn-clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      resetFilters();
      // Sync offcanvas radios
      offcanvasBody.querySelectorAll('input[name="category-filter"]').forEach(r => r.checked = r.value === 'all');
      offcanvasBody.querySelectorAll('input[name="price-filter"]').forEach(r => r.checked = r.value === 'all');
      offcanvasBody.querySelectorAll('input[name="brand-filter"]').forEach(c => c.checked = false);
      offcanvasBody.querySelectorAll('input[name="rating-filter"]').forEach(c => c.checked = false);
      offcanvasBody.querySelectorAll('.color-dot-filter').forEach(d => d.classList.remove('active'));
      const st = offcanvasBody.querySelector('input[name="stock-filter"]');
      if (st) st.checked = false;
    });
  }
}

/**
 * Resets all active filters.
 */
function resetFilters() {
  filterState.category = 'all';
  filterState.price = 'all';
  filterState.badge = 'all';
  filterState.brands = [];
  filterState.ratings = [];
  filterState.colors = [];
  filterState.inStockOnly = false;
  filterState.searchQuery = '';
  filterState.wishlistOnly = false;
  filterState.currentPage = 1;

  // Reset desktop controls
  const catRadios = document.querySelectorAll('input[name="category-filter"]');
  catRadios.forEach(radio => radio.checked = radio.value === 'all');

  const priceRadios = document.querySelectorAll('input[name="price-filter"]');
  priceRadios.forEach(radio => radio.checked = radio.value === 'all');

  const brandCbs = document.querySelectorAll('input[name="brand-filter"]');
  brandCbs.forEach(cb => cb.checked = false);

  const ratingCbs = document.querySelectorAll('input[name="rating-filter"]');
  ratingCbs.forEach(cb => cb.checked = false);

  const colorDots = document.querySelectorAll('.color-dot-filter');
  colorDots.forEach(dot => dot.classList.remove('active'));

  const stockCb = document.querySelector('input[name="stock-filter"]');
  if (stockCb) stockCb.checked = false;

  const globalSearch = document.getElementById('global-search-input');
  if (globalSearch) globalSearch.value = '';

  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Products';

  applyFiltersAndRender();
}

/**
 * Filters, sorts, and paginates product list, then renders content.
 */
function applyFiltersAndRender() {
  let filtered = [...productsList];

  // 1. Category Filter
  if (filterState.category !== 'all') {
    filtered = filtered.filter(p => p.category.toLowerCase() === filterState.category.toLowerCase());
  }

  // 2. Price Filter
  if (filterState.price !== 'all') {
    if (filterState.price === 'under-50') {
      filtered = filtered.filter(p => p.price < 50.00);
    } else if (filterState.price === '50-100') {
      filtered = filtered.filter(p => p.price >= 50.00 && p.price <= 100.00);
    } else if (filterState.price === '100-200') {
      filtered = filtered.filter(p => p.price >= 100.00 && p.price <= 200.00);
    } else if (filterState.price === 'over-200') {
      filtered = filtered.filter(p => p.price > 200.00);
    }
  }

  // 3. Badge Filter
  if (filterState.badge !== 'all') {
    filtered = filtered.filter(p => (p.badge || '').toUpperCase() === filterState.badge.toUpperCase());
  }

  // 4. Brand Filter
  if (filterState.brands.length > 0) {
    filtered = filtered.filter(p => filterState.brands.includes(p.brand));
  }

  // 5. Rating Filter
  if (filterState.ratings.length > 0) {
    // Select-all logic (match if it is greater than or equal to the minimum of selected ratings)
    const minRating = Math.min(...filterState.ratings);
    filtered = filtered.filter(p => p.rating >= minRating);
  }

  // 6. Color Filter
  if (filterState.colors.length > 0) {
    filtered = filtered.filter(p =>
      p.colors && p.colors.some(c => filterState.colors.includes(c))
    );
  }

  // 7. Stock Availability
  if (filterState.inStockOnly) {
    filtered = filtered.filter(p => p.stockStatus === 'in-stock');
  }

  // 8. Search Input Match
  if (filterState.searchQuery) {
    const q = filterState.searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // 9. Wishlist Only Page
  if (filterState.wishlistOnly) {
    const wishlist = getLocalStorage('wishlist', []);
    filtered = filtered.filter(p => wishlist.some(w => w.id === p.id));
  }

  // 10. Sorting
  sortProducts(filtered);

  // 11. Update count text
  const countText = document.getElementById('products-count-text');
  if (countText) {
    countText.textContent = `Showing ${filtered.length} products`;
  }

  // 12. Render Filter Chips
  renderFilterChips();

  // 13. Paginate & Render
  renderPaginatedProducts(filtered);
}

/**
 * Sorts array based on selected rule.
 * @param {Array} arr
 */
function sortProducts(arr) {
  if (filterState.sort === 'popular') {
    arr.sort((a, b) => b.reviewsCount - a.reviewsCount);
  } else if (filterState.sort === 'price-low') {
    arr.sort((a, b) => a.price - b.price);
  } else if (filterState.sort === 'price-high') {
    arr.sort((a, b) => b.price - a.price);
  } else if (filterState.sort === 'rated') {
    arr.sort((a, b) => b.rating - a.rating);
  } else if (filterState.sort === 'newest') {
    arr.sort((a, b) => {
      const aNew = a.badge === 'NEW' ? 1 : 0;
      const bNew = b.badge === 'NEW' ? 1 : 0;
      return bNew - aNew;
    });
  }
}

/**
 * Generates filter pills/chips above product grid.
 */
function renderFilterChips() {
  const container = document.getElementById('active-filter-chips');
  if (!container) return;

  let html = '';

  if (filterState.category !== 'all') {
    html += `
      <span class="filter-chip">
        Category: ${filterState.category}
        <i class="bi bi-x-circle-fill" data-clear="category"></i>
      </span>
    `;
  }

  if (filterState.price !== 'all') {
    html += `
      <span class="filter-chip">
        Price: ${filterState.price}
        <i class="bi bi-x-circle-fill" data-clear="price"></i>
      </span>
    `;
  }

  if (filterState.badge !== 'all') {
    html += `
      <span class="filter-chip">
        Badge: ${filterState.badge}
        <i class="bi bi-x-circle-fill" data-clear="badge"></i>
      </span>
    `;
  }

  filterState.brands.forEach(b => {
    html += `
      <span class="filter-chip">
        Brand: ${b}
        <i class="bi bi-x-circle-fill" data-clear-brand="${b}"></i>
      </span>
    `;
  });

  if (filterState.ratings.length > 0) {
    const min = Math.min(...filterState.ratings);
    html += `
      <span class="filter-chip">
        Rating: ${min}+ Stars
        <i class="bi bi-x-circle-fill" data-clear="rating"></i>
      </span>
    `;
  }

  if (filterState.inStockOnly) {
    html += `
      <span class="filter-chip">
        In Stock
        <i class="bi bi-x-circle-fill" data-clear="stock"></i>
      </span>
    `;
  }

  if (filterState.searchQuery) {
    html += `
      <span class="filter-chip">
        Search: "${filterState.searchQuery}"
        <i class="bi bi-x-circle-fill" data-clear="search"></i>
      </span>
    `;
  }

  container.innerHTML = html;

  // Bind clear events
  container.querySelectorAll('[data-clear]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-clear');
      if (type === 'category') {
        filterState.category = 'all';
        const rad = document.querySelector('input[name="category-filter"][value="all"]');
        if (rad) rad.checked = true;
      } else if (type === 'price') {
        filterState.price = 'all';
        const rad = document.querySelector('input[name="price-filter"][value="all"]');
        if (rad) rad.checked = true;
      } else if (type === 'badge') {
        filterState.badge = 'all';
      } else if (type === 'rating') {
        filterState.ratings = [];
        document.querySelectorAll('input[name="rating-filter"]').forEach(c => c.checked = false);
      } else if (type === 'stock') {
        filterState.inStockOnly = false;
        const cb = document.querySelector('input[name="stock-filter"]');
        if (cb) cb.checked = false;
      } else if (type === 'search') {
        filterState.searchQuery = '';
        const globalSearch = document.getElementById('global-search-input');
        if (globalSearch) globalSearch.value = '';
      }
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  container.querySelectorAll('[data-clear-brand]').forEach(btn => {
    btn.addEventListener('click', () => {
      const brand = btn.getAttribute('data-clear-brand');
      filterState.brands = filterState.brands.filter(b => b !== brand);
      const cb = document.querySelector(`input[name="brand-filter"][value="${brand}"]`);
      if (cb) cb.checked = false;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });
}

/**
 * Paginates results and renders HTML grid or list items.
 * @param {Array} items
 */
function renderPaginatedProducts(items) {
  const grid = document.getElementById('plp-products-grid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-search fs-1 text-muted"></i>
        <h3 class="mt-3 text-dark fw-bold">No products match your selections</h3>
        <p class="text-secondary">Try adjusting your filters or clearing search criteria.</p>
        <button class="btn btn-primary-custom mt-2" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    document.getElementById('plp-pagination-nav').style.display = 'none';
    return;
  }

  document.getElementById('plp-pagination-nav').style.display = 'block';

  // Pagination calculation
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / filterState.itemsPerPage);

  if (filterState.currentPage > totalPages) filterState.currentPage = totalPages;
  if (filterState.currentPage < 1) filterState.currentPage = 1;

  const startIdx = (filterState.currentPage - 1) * filterState.itemsPerPage;
  const endIdx = startIdx + filterState.itemsPerPage;
  const pageItems = items.slice(startIdx, endIdx);

  let html = '';

  pageItems.forEach((product, index) => {
    const isSaved = isInWishlist(product.id);
    const wishlistIcon = isSaved ? 'bi-heart-fill' : 'bi-heart';
    const wishlistClass = isSaved ? 'product-wishlist-btn active' : 'product-wishlist-btn';
    const badgeHtml = product.badge ? `<span class="product-badge bg-${product.badgeType}">${product.badge}</span>` : '';
    const originalPriceHtml = product.originalPrice ? `<span class="original-price">${formatCurrency(product.originalPrice)}</span>` : '';

    if (filterState.layout === 'grid') {
      // Grid Card
      html += `
        <div class="col-md-6 col-lg-4 col-sm-12" data-aos="fade-up">
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
                <button class="add-to-cart-circle btn-add-cart-fast" data-product-id="${product.id}" aria-label="Add ${product.name} to Cart">
                  <i class="bi bi-cart-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      // List Row Card
      html += `
        <div class="col-12" data-aos="fade-up">
          <div class="product-card-list">
            <div class="product-image-wrapper relative">
              ${badgeHtml}
              <button class="${wishlistClass}" data-wishlist-id="${product.id}" aria-label="Add to Wishlist">
                <i class="bi ${wishlistIcon}"></i>
              </button>
              <a href="product.html?id=${product.id}" class="d-block w-100 h-100">
                <img src="${product.image}" alt="${product.name}" class="product-card-img" style="height:100%; object-fit:cover;">
              </a>
            </div>
            <div class="product-details">
              <div class="product-category">${product.category}</div>
              <a href="product.html?id=${product.id}" class="product-title fs-5">${product.name}</a>
              <div class="product-rating mb-2">
                <span class="rating-stars">${renderStars(product.rating)}</span>
                <span class="rating-count">(${product.reviewsCount})</span>
              </div>
              <p class="text-secondary mb-3 d-none d-md-block" style="font-size:0.88rem;">${product.description}</p>
              <div class="product-price-row">
                <div class="price-container">
                  <span class="current-price fs-4">${formatCurrency(product.price)}</span>
                  ${originalPriceHtml}
                </div>
                <button class="btn btn-primary-custom btn-add-cart-full d-flex align-items-center gap-2" data-product-id="${product.id}">
                  <i class="bi bi-cart3"></i> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  });

  grid.innerHTML = html;
  bindProductCardEvents(grid);

  renderPaginationControls(totalPages);
}

/**
 * Creates dynamic page numbers list.
 * @param {number} totalPages
 */
function renderPaginationControls(totalPages) {
  const container = document.getElementById('plp-pagination');
  if (!container) return;

  let html = '';

  // Prev
  const prevDisabled = filterState.currentPage === 1 ? 'disabled' : '';
  html += `
    <li class="page-item ${prevDisabled}">
      <button class="page-link border" data-page="${filterState.currentPage - 1}" aria-label="Previous Page">
        <i class="bi bi-chevron-left"></i>
      </button>
    </li>
  `;

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    const active = filterState.currentPage === i ? 'active' : '';
    html += `
      <li class="page-item ${active}">
        <button class="page-link border font-weight-600" data-page="${i}">${i}</button>
      </li>
    `;
  }

  // Next
  const nextDisabled = filterState.currentPage === totalPages ? 'disabled' : '';
  html += `
    <li class="page-item ${nextDisabled}">
      <button class="page-link border" data-page="${filterState.currentPage + 1}" aria-label="Next Page">
        <i class="bi bi-chevron-right"></i>
      </button>
    </li>
  `;

  container.innerHTML = html;

  // Bind clicks
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.getAttribute('data-page'));
      if (page >= 1 && page <= totalPages) {
        filterState.currentPage = page;
        applyFiltersAndRender();
        window.scrollTo({ top: 180, behavior: 'smooth' });
      }
    });
  });
}

/**
 * Binds quick cart/wishlist click events.
 */
function bindProductCardEvents(container) {
  container.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-wishlist-id');
      const prod = productsList.find(p => p.id === id);
      if (prod) toggleWishlist(prod);
    });
  });

  container.querySelectorAll('[data-product-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-product-id');
      const prod = productsList.find(p => p.id === id);
      if (prod) addToCart(prod, 1);
    });
  });
}

// Global reset access for onclick inside innerHTML fallbacks
window.resetFilters = resetFilters;

// Initialize
document.addEventListener('DOMContentLoaded', initProductsModule);
