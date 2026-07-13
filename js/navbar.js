/* Sticky Header & Badge Sync Logic */
import { getLocalStorage, isAuthenticated, showLoginPrompt } from './utils.js';

function toggleAnnouncementLogout() {
  const logoutButton = document.getElementById('announcement-logout-btn');
  if (!logoutButton) return;

  if (isAuthenticated()) {
    logoutButton.classList.remove('d-none');
  } else {
    logoutButton.classList.add('d-none');
  }
}

/**
 * Updates the badges in the navbar for Cart and Wishlist count.
 */
export function updateNavbarBadges() {
  const accountLabel = document.getElementById('header-account-label');
  const accountLink = document.getElementById('header-account-link');
  const currentUser = JSON.parse(localStorage.getItem('vital-auth-user') || 'null');

  toggleAnnouncementLogout();

  if (accountLabel) {
    if (currentUser?.name) {
      accountLabel.textContent = currentUser.name.split(' ')[0];
      if (accountLink) {
        accountLink.setAttribute('aria-label', `User Account: ${currentUser.name}`);
      }
    } else {
      accountLabel.textContent = 'Login';
      if (accountLink) {
        accountLink.setAttribute('aria-label', 'User Account');
      }
    }
  }

  if (!isAuthenticated()) {
    const cartBadge = document.getElementById('cart-badge-count');
    const wishlistBadge = document.getElementById('wishlist-badge-count');
    if (cartBadge) cartBadge.style.display = 'none';
    if (wishlistBadge) wishlistBadge.style.display = 'none';
    return;
  }

  const cart = getLocalStorage('cart', []);
  const wishlist = getLocalStorage('wishlist', []);
  
  // Sum up quantities for the cart badge
  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalWishlistCount = wishlist.length;
  
  const cartBadge = document.getElementById('cart-badge-count');
  const wishlistBadge = document.getElementById('wishlist-badge-count');
  
  if (cartBadge) {
    if (totalCartCount > 0) {
      cartBadge.textContent = totalCartCount;
      cartBadge.style.display = 'flex';
    } else {
      cartBadge.style.display = 'none';
    }
  }
  
  if (wishlistBadge) {
    if (totalWishlistCount > 0) {
      wishlistBadge.textContent = totalWishlistCount;
      wishlistBadge.style.display = 'flex';
    } else {
      wishlistBadge.style.display = 'none';
    }
  }
}

/**
 * Initializes Sticky Header functionality.
 */
export function initAuthUI() {
  const logoutButton = document.getElementById('announcement-logout-btn');

  if (logoutButton && !logoutButton.dataset.bound) {
    logoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('vital-auth-user');
      window.dispatchEvent(new Event('authStateChanged'));
      updateNavbarBadges();
      window.location.href = 'index.html';
    });
    logoutButton.dataset.bound = 'true';
  }

  if (!window.__vitalAuthUIInitialized) {
    window.addEventListener('authStateChanged', () => {
      updateNavbarBadges();
    });
    window.__vitalAuthUIInitialized = true;
  }

  updateNavbarBadges();
}

export function initStickyHeader() {
  const header = document.querySelector('.header-wrapper');
  if (!header) return;
  
  const handleScroll = () => {
    if (window.scrollY > 120) {
      header.classList.add('is-sticky');
    } else {
      header.classList.remove('is-sticky');
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  
  // Set active nav link based on current page path
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link-custom');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
    }
  });

  const protectedLinks = document.querySelectorAll('[data-requires-auth]');
  protectedLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      if (!isAuthenticated()) {
        event.preventDefault();
        showLoginPrompt(link.dataset.authTarget || 'account');
      }
    });
  });
}

/**
 * Initializes mobile search toggle functionality.
 */
export function initMobileSearch() {
  const searchToggle = document.getElementById('mobile-search-toggle');
  const searchBar = document.getElementById('mobile-search-bar');
  const mobileSearchInput = document.getElementById('mobile-search-input');

  if (searchToggle) {
    searchToggle.addEventListener('click', () => {
      if (searchBar) {
        const isActive = searchBar.classList.contains('active');
        if (isActive) {
          searchBar.classList.remove('active');
          searchBar.style.display = 'none';
        } else {
          searchBar.classList.add('active');
          searchBar.style.display = 'block';
          if (mobileSearchInput) {
            mobileSearchInput.focus();
          }
        }
      }
    });
  }
}

/**
 * Initializes proper body padding management for modals and offcanvas.
 */
export function initModalScrollFix() {
  document.addEventListener('show.bs.modal', () => {
    document.body.style.paddingRight = '0';
  });

  document.addEventListener('hide.bs.modal', () => {
    document.body.style.paddingRight = '';
  });
}

// Initializations are managed by components-loader.js after templates are fetched.
