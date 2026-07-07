/* Live Search & Suggestions System */
import { getLocalStorage, setLocalStorage } from './utils.js';

let allProducts = [];

/**
 * Initializes the Search autocomplete system.
 */
export async function initSearch() {
  const searchInput = document.getElementById('global-search-input');
  const suggestionsBox = document.getElementById('search-suggestions-box');
  if (!searchInput || !suggestionsBox) return;

  // Load products list for search index
  try {
    const res = await fetch('./data/products.json');
    allProducts = await res.json();
  } catch (error) {
    console.error('Failed to load products index for search:', error);
  }

  // Handle Input Focus / Clicks
  searchInput.addEventListener('focus', () => {
    showSuggestions(searchInput.value.trim());
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = 'none';
    }
  });

  // Handle Input typing
  searchInput.addEventListener('input', () => {
    showSuggestions(searchInput.value.trim());
  });

  // Handle Enter key or Form Submit
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const term = searchInput.value.trim();
      if (term) {
        saveRecentSearch(term);
        // Redirect to PLP with query parameter
        window.location.href = `products.html?search=${encodeURIComponent(term)}`;
      }
    }
  });
}

/**
 * Displays recent searches or search results based on input text.
 * @param {string} query
 */
function showSuggestions(query) {
  const suggestionsBox = document.getElementById('search-suggestions-box');
  const searchInput = document.getElementById('global-search-input');
  if (!suggestionsBox) return;

  if (!query) {
    // Show Recent Searches
    const recents = getLocalStorage('recent_searches', []);
    if (recents.length === 0) {
      suggestionsBox.style.display = 'none';
      return;
    }

    let html = `
      <div class="recent-search-header">
        <span>Recent Searches</span>
        <span class="clear-recent" id="btn-clear-recent">Clear</span>
      </div>
    `;

    recents.forEach(term => {
      html += `
        <div class="suggestion-item" data-search-term="${term}">
          <i class="bi bi-clock-history"></i>
          <span>${escapeHTML(term)}</span>
        </div>
      `;
    });

    suggestionsBox.innerHTML = html;
    suggestionsBox.style.display = 'block';

    // Hook click listeners
    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.getAttribute('data-search-term');
        searchInput.value = val;
        saveRecentSearch(val);
        window.location.href = `products.html?search=${encodeURIComponent(val)}`;
      });
    });

    const clearBtn = document.getElementById('btn-clear-recent');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setLocalStorage('recent_searches', []);
        suggestionsBox.style.display = 'none';
      });
    }
  } else {
    // Perform search matching
    const matches = allProducts.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.category.toLowerCase().includes(query.toLowerCase()) || 
      p.brand.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // Limit to top 5 hits

    if (matches.length === 0) {
      suggestionsBox.innerHTML = `
        <div class="p-3 text-center text-muted font-size-sm">
          No matches found for "${escapeHTML(query)}"
        </div>
      `;
      suggestionsBox.style.display = 'block';
      return;
    }

    let html = '';
    matches.forEach(p => {
      const highlightedName = highlightText(p.name, query);
      html += `
        <div class="suggestion-item" data-product-id="${p.id}" data-search-term="${p.name}">
          <i class="bi bi-search"></i>
          <div>
            <div>${highlightedName}</div>
            <small class="text-muted" style="font-size:0.75rem;">in ${p.category}</small>
          </div>
        </div>
      `;
    });

    suggestionsBox.innerHTML = html;
    suggestionsBox.style.display = 'block';

    // Hook click listeners
    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const prodId = item.getAttribute('data-product-id');
        const term = item.getAttribute('data-search-term');
        saveRecentSearch(term);
        // Direct to PDP (Product Detail Page)
        window.location.href = `product.html?id=${prodId}`;
      });
    });
  }
}

/**
 * Saves a term to recent searches list.
 * @param {string} term
 */
function saveRecentSearch(term) {
  if (!term) return;
  let recents = getLocalStorage('recent_searches', []);
  // Filter out existing and keep first 5
  recents = [term, ...recents.filter(x => x.toLowerCase() !== term.toLowerCase())].slice(0, 5);
  setLocalStorage('recent_searches', recents);
}

/**
 * Highlights matches in a text block.
 * @param {string} text
 * @param {string} query
 * @returns {string}
 */
function highlightText(text, query) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return escapeHTML(text);
  
  const originalMatch = text.slice(index, index + query.length);
  const before = text.slice(0, index);
  const after = text.slice(index + query.length);
  
  return `${escapeHTML(before)}<span class="highlight">${escapeHTML(originalMatch)}</span>${escapeHTML(after)}`;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Initializations are managed by components-loader.js after templates are fetched.
