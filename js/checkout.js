/* Checkout Form and Validation Controller Module */
import { getLocalStorage, setLocalStorage, formatCurrency, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();
});

/**
 * Initializes Checkout Page rendering and binding.
 */
function initCheckoutPage() {
  const form = document.getElementById('checkout-main-form');
  if (!form) return;

  const cart = getLocalStorage('cart', []);
  if (cart.length === 0) {
    showToast('Your shopping cart is empty! Redirecting to shop...', 'warning');
    setTimeout(() => {
      window.location.href = 'products.html';
    }, 2000);
    return;
  }

  // 1. Render Order Review panel
  renderOrderReview();

  // 2. Setup Payment Accordion choices
  setupPaymentAccordion();

  // 3. Handle Form Validation and Placing Order
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Perform standard HTML validation
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add('was-validated');
      showToast('Please correct the validation errors in the checkout form.', 'danger');
      return;
    }
    
    // Additional validation for credit card if active
    const selectedPayment = document.querySelector('input[name="payment-method"]:checked').value;
    if (selectedPayment === 'cc') {
      const ccName = document.getElementById('cc-name').value.trim();
      const ccNum = document.getElementById('cc-number').value.replace(/\s+/g, '');
      const ccCvv = document.getElementById('cc-cvv').value.trim();
      const ccExpiry = document.getElementById('cc-expiry').value.trim();
      
      if (!/^[a-zA-Z\s]{3,50}$/.test(ccName)) {
        showCustomInvalid('cc-name', 'Cardholder name must contain only letters and spaces (3-50 characters).');
        return;
      } else {
        clearCustomInvalid('cc-name');
      }

      if (ccNum.length !== 16 || isNaN(ccNum)) {
        showCustomInvalid('cc-number', 'Enter a valid 16-digit card number.');
        return;
      } else {
        clearCustomInvalid('cc-number');
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(ccExpiry)) {
        showCustomInvalid('cc-expiry', 'Expiration date must be MM/YY (e.g. 12/28).');
        return;
      } else {
        clearCustomInvalid('cc-expiry');
      }

      if (!/^\d{3}$/.test(ccCvv)) {
        showCustomInvalid('cc-cvv', 'CVV must be exactly 3 numbers.');
        return;
      } else {
        clearCustomInvalid('cc-cvv');
      }
    }
    
    // Successful checkout -> generate Order
    processOrderSuccess();
  });
}

function showCustomInvalid(inputId, msg) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add('is-invalid');
  const feedback = input.nextElementSibling;
  if (feedback && feedback.classList.contains('invalid-feedback')) {
    feedback.textContent = msg;
  }
}

function clearCustomInvalid(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.classList.remove('is-invalid');
}

/**
 * Renders thumbnail lists of items and final calculations in right column.
 */
function renderOrderReview() {
  const listContainer = document.getElementById('checkout-items-list');
  const subtotalSpan = document.getElementById('checkout-subtotal');
  const discountRow = document.getElementById('checkout-discount-row');
  const discountSpan = document.getElementById('checkout-discount');
  const shippingSpan = document.getElementById('checkout-shipping');
  const grandTotalSpan = document.getElementById('checkout-grand-total');

  if (!listContainer) return;

  const cart = getLocalStorage('cart', []);
  const totals = getLocalStorage('cart_totals', {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    grandTotal: 0
  });

  let html = '';
  cart.forEach(item => {
    html += `
      <div class="checkout-summary-item">
        <img src="${item.image}" alt="${item.name}" class="checkout-summary-img">
        <div class="flex-grow-1">
          <div class="font-weight-700 text-dark" style="font-size:0.88rem; line-height:1.2;">${item.name}</div>
          <small class="text-secondary" style="font-size:0.75rem;">Qty: ${item.quantity}</small>
        </div>
        <span class="font-weight-600 text-dark" style="font-size:0.9rem;">${formatCurrency(item.price * item.quantity)}</span>
      </div>
    `;
  });
  listContainer.innerHTML = html;

  // Render prices
  if (subtotalSpan) subtotalSpan.textContent = formatCurrency(totals.subtotal);
  
  if (totals.discount > 0) {
    if (discountRow) discountRow.style.display = 'flex';
    if (discountSpan) discountSpan.textContent = `-${formatCurrency(totals.discount)}`;
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  if (shippingSpan) {
    shippingSpan.textContent = totals.shipping > 0 ? formatCurrency(totals.shipping) : 'Free';
  }

  if (grandTotalSpan) {
    grandTotalSpan.textContent = formatCurrency(totals.grandTotal);
  }
}

/**
 * Handles Accordion Selection classes toggles.
 */
function setupPaymentAccordion() {
  const items = document.querySelectorAll('.payment-accordion-item');
  items.forEach(item => {
    const radio = item.querySelector('input[type="radio"]');
    
    // Click on block anywhere
    item.querySelector('.payment-accordion-header').addEventListener('click', () => {
      items.forEach(i => {
        i.classList.remove('active');
        i.querySelector('input[type="radio"]').checked = false;
      });
      item.classList.add('active');
      radio.checked = true;
      
      // Update form required fields dynamically based on active selection
      toggleCCRequiredFields(radio.value === 'cc');
    });
  });
}

function toggleCCRequiredFields(isRequired) {
  const ccInputs = ['cc-name', 'cc-number', 'cc-expiry', 'cc-cvv'];
  ccInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (isRequired) {
        el.setAttribute('required', 'required');
      } else {
        el.removeAttribute('required');
        el.classList.remove('is-invalid');
      }
    }
  });
}

/**
 * Completes transaction, saves Last Order details and directs confirmation.
 */
function processOrderSuccess() {
  const firstName = document.getElementById('shipping-first-name').value.trim();
  const lastName = document.getElementById('shipping-last-name').value.trim();
  const address = document.getElementById('shipping-address').value.trim();
  const city = document.getElementById('shipping-city').value.trim();
  const state = document.getElementById('shipping-state').value.trim();
  const zip = document.getElementById('shipping-zip').value.trim();
  const email = document.getElementById('shipping-email').value.trim();
  const selectedPayment = document.querySelector('input[name="payment-method"]:checked').value;

  const orderId = 'VE-' + Math.floor(100000 + Math.random() * 900000);
  const cart = getLocalStorage('cart', []);
  const totals = getLocalStorage('cart_totals', {});

  const orderDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const orderInfo = {
    orderId: orderId,
    items: cart,
    totals: totals,
    shippingAddress: {
      fullName: `${firstName} ${lastName}`,
      email: email,
      addressLine: address,
      cityStateZip: `${city}, ${state} ${zip}`
    },
    paymentMethod: selectedPayment.toUpperCase(),
    orderDate: orderDate
  };

  // 1. Save last order in LocalStorage
  setLocalStorage('last_order', orderInfo);

  // 2. Clear Cart and active coupon codes
  setLocalStorage('cart', []);
  setLocalStorage('active_coupon', null);
  setLocalStorage('cart_totals', {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    grandTotal: 0
  });

  showToast('Order placed successfully! Redirecting to confirmation page...', 'success');

  // 3. Direct to Confirmation Page
  setTimeout(() => {
    window.location.href = `confirmation.html`;
  }, 1500);
}
