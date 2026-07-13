/* Live Search & Suggestions System */
import { getLocalStorage, setLocalStorage } from './utils.js';

let allProducts = [];

/**
 * Initializes the Search autocomplete system for desktop and mobile inputs.
 */
export async function initSearch() {
  const searchFields = [
    {
      input: document.getElementById('global-search-input'),
      suggestionsBox: document.getElementById('search-suggestions-box')
    },
    {
      input: document.getElementById('mobile-search-input'),
      suggestionsBox: document.getElementById('mobile-search-suggestions-box')
    }
  ].filter(({ input, suggestionsBox }) => input && suggestionsBox);

  if (searchFields.length === 0) return;

  try {
    const res = await fetch('./data/products.json');
    allProducts = await res.json();
  } catch (error) {
    console.error('Failed to load products index for search:', error);
  }

  searchFields.forEach(({ input, suggestionsBox }) => {
    attachSearchField(input, suggestionsBox);
  });

  document.addEventListener('click', (e) => {
    searchFields.forEach(({ input, suggestionsBox }) => {
      if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = 'none';
      }
    });
  });
}

function attachSearchField(searchInput, suggestionsBox) {
  searchInput.addEventListener('focus', () => {
    showSuggestions(searchInput.value.trim(), searchInput, suggestionsBox);
  });

  searchInput.addEventListener('input', () => {
    showSuggestions(searchInput.value.trim(), searchInput, suggestionsBox);
  });

  const searchButton = searchInput.closest('.search-container')?.querySelector('.search-btn');
  if (searchButton) {
    searchButton.addEventListener('click', (e) => {
      e.preventDefault();
      submitSearch(searchInput);
    });
  }

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSearch(searchInput);
    }
  });
}

function submitSearch(searchInput) {
  const term = searchInput.value.trim();
  if (!term) return;

  saveRecentSearch(term);
  window.location.href = `products.html?search=${encodeURIComponent(term)}`;
}

/**
 * Displays recent searches or search results based on input text.
 * @param {string} query
 * @param {HTMLInputElement} searchInput
 * @param {HTMLElement} suggestionsBox
 */
function showSuggestions(query, searchInput, suggestionsBox) {
  if (!suggestionsBox || !searchInput) return;

  if (!query) {
    const recents = getLocalStorage('recent_searches', []);
    if (recents.length === 0) {
      suggestionsBox.style.display = 'none';
      return;
    }

    let html = `
      <div class="recent-search-header">
        <span>Recent Searches</span>
        <span class="clear-recent">Clear</span>
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

    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.getAttribute('data-search-term');
        searchInput.value = val;
        saveRecentSearch(val);
        window.location.href = `products.html?search=${encodeURIComponent(val)}`;
      });
    });

    const clearBtn = suggestionsBox.querySelector('.clear-recent');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setLocalStorage('recent_searches', []);
        suggestionsBox.style.display = 'none';
      });
    }
  } else {
    const matches = allProducts.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

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

    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const prodId = item.getAttribute('data-product-id');
        const term = item.getAttribute('data-search-term');
        saveRecentSearch(term);
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
