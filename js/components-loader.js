import { initAuthUI, initStickyHeader, updateNavbarBadges, initMobileSearch, initModalScrollFix } from './navbar.js';
import { initSearch } from './search.js';

/**
 * Loads shared HTML templates and injects them into the placeholders.
 */
export async function loadSharedComponents() {
  const components = [
    { id: 'announcement-bar-placeholder', file: 'components/announcement.html' },
    { id: 'header-placeholder', file: 'components/header.html' },
    { id: 'footer-placeholder', file: 'components/footer.html' }
  ];

  for (const comp of components) {
    const element = document.getElementById(comp.id);
    if (element) {
      try {
        const response = await fetch(comp.file);
        if (response.ok) {
          element.innerHTML = await response.text();
        } else {
          console.error(`Failed to load component: ${comp.file} (${response.status})`);
        }
      } catch (error) {
        console.error(`Error fetching component ${comp.file}:`, error);
      }
    }
  }

  // Once all elements are present, wire up the listeners
  initStickyHeader();
  updateNavbarBadges();
  initAuthUI();
  initMobileSearch();
  initModalScrollFix();
  initSearch();
}

// Automatically load components on page load
document.addEventListener('DOMContentLoaded', loadSharedComponents);
