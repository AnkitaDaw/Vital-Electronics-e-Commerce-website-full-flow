/* Main Application Bootstrapper */
import { initSliders } from './slider.js';
import { showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Seed Mock Data matching design badges on first load if empty
  const existingCart = localStorage.getItem('cart');

  if (!existingCart) {
    localStorage.setItem('cart', JSON.stringify([
      {
        id: "vital-earbuds-pro",
        name: "Vital Earbuds Pro",
        price: 59.00,
        category: "Audio",
        image: "assets/images/products/vital-earbuds-pro.png",
        quantity: 2,
        selectedColor: "#111827",
        brand: "Vital"
      }
    ]));
    localStorage.setItem('cart_totals', JSON.stringify({
      subtotal: 118.00,
      discount: 40.00,
      couponDiscount: 0,
      shipping: 0,
      grandTotal: 118.00
    }));
  }

  // Force badge sync
  import('./navbar.js').then(module => {
    module.updateNavbarBadges();
  });

  // 2. Initialize Carousels
  initSliders();

  // 2. Initialize AOS Scroll Animation Library
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-in-out',
    });
  }

  // 3. Setup Back to Top Button
  const backToTopBtn = document.getElementById('btn-back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.display = 'flex';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // 4. Newsletter Subscription Form Handler
  const newsletterForm = document.getElementById('newsletter-subscribe-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('newsletter-email-input');
      if (!emailInput) return;

      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        showToast('Please enter your email address.', 'danger');
        return;
      }

      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'danger');
        return;
      }

      // Simulate API registration
      showToast('Thank you! You have successfully subscribed to our newsletter.', 'success');
      emailInput.value = '';
    });
  }
});
