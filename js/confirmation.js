/* Order Confirmation Controller Module */
import { getLocalStorage, formatCurrency, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  initConfirmationPage();
});

/**
 * Initializes Confirmation Page rendering.
 */
function initConfirmationPage() {
  const order = getLocalStorage('last_order', null);

  if (!order) {
    const container = document.getElementById('confirmation-page-container');
    if (container) {
      container.innerHTML = `
        <div class="row text-center py-5">
          <div class="col-12">
            <i class="bi bi-x-circle fs-1 text-danger"></i>
            <h2 class="mt-3 fw-bold">No Active Order Found</h2>
            <p class="text-secondary">We couldn't retrieve any recent order information from your session.</p>
            <a href="index.html" class="btn btn-primary-custom mt-3">Go to Homepage</a>
          </div>
        </div>
      `;
    }
    return;
  }

  // 1. Render Success details
  const idSpan = document.getElementById('confirm-order-id');
  if (idSpan) idSpan.textContent = `Order ID: ${order.orderId}`;
  
  const dateSpan = document.getElementById('confirm-order-date');
  if (dateSpan) dateSpan.textContent = order.orderDate;

  // 2. Render Shipping Address
  const nameSpan = document.getElementById('confirm-shipping-name');
  if (nameSpan) nameSpan.textContent = order.shippingAddress.fullName;

  const addrSpan = document.getElementById('confirm-shipping-address');
  if (addrSpan) {
    addrSpan.innerHTML = `
      ${order.shippingAddress.addressLine}<br>
      ${order.shippingAddress.cityStateZip}
    `;
  }

  const emailSpan = document.getElementById('confirm-shipping-email');
  if (emailSpan) emailSpan.textContent = order.shippingAddress.email;

  const paymentSpan = document.getElementById('confirm-payment-method');
  if (paymentSpan) {
    let methodText = order.paymentMethod;
    if (order.paymentMethod === 'CC') methodText = 'Credit / Debit Card';
    if (order.paymentMethod === 'PAYPAL') methodText = 'PayPal';
    if (order.paymentMethod === 'COD') methodText = 'Cash on Delivery';
    paymentSpan.textContent = methodText;
  }

  // 3. Render Purchased Items Summary
  const listContainer = document.getElementById('confirm-items-list');
  const subtotalSpan = document.getElementById('confirm-subtotal');
  const discountRow = document.getElementById('confirm-discount-row');
  const discountSpan = document.getElementById('confirm-discount');
  const shippingSpan = document.getElementById('confirm-shipping');
  const grandTotalSpan = document.getElementById('confirm-grand-total');

  if (listContainer) {
    let html = '';
    order.items.forEach(item => {
      html += `
        <div class="confirm-summary-item">
          <img src="${item.image}" alt="${item.name}" class="confirm-summary-img">
          <div class="flex-grow-1">
            <div class="font-weight-700 text-dark" style="font-size:0.85rem; line-height:1.2;">${item.name}</div>
            <small class="text-secondary" style="font-size:0.75rem;">Quantity: ${item.quantity}</small>
          </div>
          <span class="font-weight-600 text-dark" style="font-size:0.88rem;">${formatCurrency(item.price * item.quantity)}</span>
        </div>
      `;
    });
    listContainer.innerHTML = html;
  }

  // Render prices
  if (subtotalSpan) subtotalSpan.textContent = formatCurrency(order.totals.subtotal);
  
  if (order.totals.discount > 0) {
    if (discountRow) discountRow.style.display = 'flex';
    if (discountSpan) discountSpan.textContent = `-${formatCurrency(order.totals.discount)}`;
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  if (shippingSpan) {
    shippingSpan.textContent = order.totals.shipping > 0 ? formatCurrency(order.totals.shipping) : 'Free';
  }

  if (grandTotalSpan) {
    grandTotalSpan.textContent = formatCurrency(order.totals.grandTotal);
  }

  // 4. Bind Action Click Buttons
  const trackBtn = document.getElementById('btn-confirm-track');
  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      showToast(`Tracking status initialized for ${order.orderId}. Updates will be sent to ${order.shippingAddress.email}.`, 'info');
    });
  }

  const printBtn = document.getElementById('btn-confirm-print');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}
