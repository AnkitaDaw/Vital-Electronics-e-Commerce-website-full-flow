/* Sticky Header & Badge Sync Logic */
import { getLocalStorage } from './utils.js';

/**
 * Updates the badges in the navbar for Cart and Wishlist count.
 */
export function updateNavbarBadges() {
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
}

// Initializations are managed by components-loader.js after templates are fetched.
