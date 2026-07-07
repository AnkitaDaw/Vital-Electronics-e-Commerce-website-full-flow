/* Wishlist Manager Module */
import { getLocalStorage, setLocalStorage, showToast } from './utils.js';
import { updateNavbarBadges } from './navbar.js';

/**
 * Checks if a product ID is in the wishlist.
 * @param {string} productId
 * @returns {boolean}
 */
export function isInWishlist(productId) {
  const wishlist = getLocalStorage('wishlist', []);
  return wishlist.some(item => item.id === productId);
}

/**
 * Toggles a product in/out of the wishlist.
 * @param {object} product - Full product object
 */
export function toggleWishlist(product) {
  if (!product || !product.id) return;
  
  let wishlist = getLocalStorage('wishlist', []);
  const index = wishlist.findIndex(item => item.id === product.id);
  
  if (index > -1) {
    // Remove
    wishlist.splice(index, 1);
    setLocalStorage('wishlist', wishlist);
    showToast(`Removed "${product.name}" from wishlist`, 'warning');
  } else {
    // Add
    wishlist.push(product);
    setLocalStorage('wishlist', wishlist);
    showToast(`Added "${product.name}" to wishlist`, 'success');
  }
  
  updateNavbarBadges();
  
  // Update UI heart button classes on the page if they exist
  const wishlistButtons = document.querySelectorAll(`[data-wishlist-id="${product.id}"]`);
  wishlistButtons.forEach(btn => {
    const isSaved = isInWishlist(product.id);
    if (isSaved) {
      btn.classList.add('active');
      btn.querySelector('i').className = 'bi bi-heart-fill';
    } else {
      btn.classList.remove('active');
      btn.querySelector('i').className = 'bi bi-heart';
    }
  });
}
