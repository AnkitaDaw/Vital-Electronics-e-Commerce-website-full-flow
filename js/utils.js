/* Modular Utility Functions */

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
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
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
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing LocalStorage key "${key}":`, error);
  }
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
