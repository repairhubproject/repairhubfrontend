
// search.js

export function filterItems(){}

export function searchByName(){}

export function searchByCategory(){}

export function clearSearch(){}

export function debounceSearch(){}

export function initSearch(){}

const categoryTabs = document.querySelectorAll('.category-tab');
const serviceSearch = document.getElementById('serviceSearch');
const serviceCards = document.querySelectorAll('.service-card');

categoryTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    categoryTabs.forEach(t => {
      t.classList.remove('bg-blue-700', 'text-white');
      t.classList.add('bg-gray-100', 'text-gray-600');
    });
    tab.classList.remove('bg-gray-100', 'text-gray-600');
    tab.classList.add('bg-blue-700', 'text-white');
  });
});

serviceSearch.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  serviceCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) ? 'flex' : 'none';
  });
});