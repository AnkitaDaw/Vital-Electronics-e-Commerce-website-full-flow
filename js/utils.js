/* Modular Utility Functions */

const AUTH_STORAGE_KEY = 'vital-auth-user';

export function getCurrentUser() {
  try {
    const user = localStorage.getItem(AUTH_STORAGE_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error reading current user:', error);
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

function getStorageKey(key) {
  const user = getCurrentUser();
  if (!user?.email) return key;
  return `${key}:${user.email.toLowerCase()}`;
}

/**
 * Formats a number to USD currency string.
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

/**
 * Generates star rating HTML based on numeric rating.
 * @param {number} rating
 * @returns {string}
 */
export function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  
  let html = '';
  for (let i = 0; i < fullStars; i++) {
    html += '<i class="bi bi-star-fill text-warning me-1"></i>';
  }
  if (hasHalf) {
    html += '<i class="bi bi-star-half text-warning me-1"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    html += '<i class="bi bi-star text-warning me-1"></i>';
  }
  return html;
}

/**
 * Safely reads from LocalStorage.
 * @param {string} key
 * @param {any} defaultValue
 * @returns {any}
 */
export function getLocalStorage(key, defaultValue = null) {
  try {
    const storageKey = getStorageKey(key);
    const item = localStorage.getItem(storageKey);
    if (item) {
      return JSON.parse(item);
    }

    const legacyItem = localStorage.getItem(key);
    if (legacyItem) {
      const parsedValue = JSON.parse(legacyItem);
      if (isAuthenticated()) {
        localStorage.setItem(storageKey, legacyItem);
      }
      return parsedValue;
    }

    return defaultValue;
  } catch (error) {
    console.error(`Error reading LocalStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely writes to LocalStorage.
 * @param {string} key
 * @param {any} value
 */
export function setLocalStorage(key, value) {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing LocalStorage key "${key}":`, error);
  }
}

export function showLoginPrompt(target = 'account') {
  let modal = document.getElementById('auth-required-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'auth-required-modal';
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header border-0">
            <h5 class="modal-title">Login or Register</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center py-4">
            <i class="bi bi-person-lock fs-1 text-primary mb-3 d-block"></i>
            <p class="mb-3">Please sign in or create an account to save items to your wishlist or cart.</p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
              <a href="account.html" class="btn btn-primary-custom">Log In or Create Account</a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

/**
 * Dynamic Toast Notification System.
 * Creates a toast overlay if not present, and triggers a slide-in alert.
 * @param {string} message - Notification text
 * @param {'success' | 'warning' | 'danger' | 'info'} type - Toast type
 */
export function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container-custom');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast-custom toast-${type}`;
  
  let iconClass = 'bi-check-circle-fill';
  if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';
  if (type === 'danger') iconClass = 'bi-x-circle-fill';
  if (type === 'info') iconClass = 'bi-info-circle-fill';
  
  toast.innerHTML = `
    <i class="bi ${iconClass} toast-icon"></i>
    <div class="toast-body">${message}</div>
    <button class="toast-close" aria-label="Close Notification">
      <i class="bi bi-x"></i>
    </button>
  `;
  
  // Close handler
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'toastFadeOut 0.3s forwards';
    toast.addEventListener('animationend', () => toast.remove());
  });
  
  container.appendChild(toast);
  
  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'toastFadeOut 0.3s forwards';
      toast.addEventListener('animationend', () => toast.remove());
    }
  }, 4000);
}
