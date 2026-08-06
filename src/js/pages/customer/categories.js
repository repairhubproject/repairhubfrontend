import {getCategories} from '../../api/categories'

const categoriesContainer = document.getElementById("categories-container");

async function renderUi() {

  try {
    const categories = await getCategories();
    console.log(categories)
    // renderCategories(categories)

  } catch (error) {
    // Error state
    console.error(error);
  }
}

renderUi();

function renderCategories(categories) {

  let html = "";
  categories.forEach((category) => {
    html += `
     <option value="">${category.name}</option>
    `;
  });

  categoriesContainer.innerHTML = html;
}
if (user) {
    
    headerA.textContent = user.name.charAt(0).toUpperCase();
    headerB.textContent = user.name
}

// ---- Mock category data (swap for a real API call later) -----------------
const CATEGORIES = [
      name: "Phones",
      subtitle: "Screen, Battery, Charging…",
      color: "bg-blue-50 text-blue-600",
      icon: `<rect x="7" y="2.5" width="10" height="19" rx="2"/><path stroke-linecap="round" d="M11 18.5h2"/>`,
    },
    {
      name: "TVs & Audio",
      subtitle: "LED, OLED, Sound System…",
      color: "bg-sky-50 text-sky-600",
      icon: `<rect x="2.5" y="4.5" width="19" height="12" rx="1.5"/><path stroke-linecap="round" d="M8 20.5h8M12 16.5v4"/>`,
    },
    {
      name: "Electrical",
      subtitle: "Installation, Repairs, Wiring…",
      color: "bg-sky-50 text-sky-500",
      icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M8 2.5v4M13 2.5v4M6.5 6.5h8v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-4Z"/><path stroke-linecap="round" d="M10.5 14.5v3.5M10.5 21.5v-1.5"/>`,
    },
    {
      name: "Carpentry",
      subtitle: "Furniture, Doors, Cabinets…",
      color: "bg-blue-50 text-blue-700",
      icon: `<path stroke-linecap="round" stroke-linejoin="round" d="m14.5 6.5 4.7-3.2 2.3 2.3-3.2 4.7M14.5 6.5 3.5 17.5a2 2 0 0 0 2.8 2.8L17.3 9.3M14.5 6.5l2.8 2.8"/>`,
    },
    {
      name: "Laptops",
      subtitle: "Hardware, Software, Upgrade…",
      color: "bg-blue-50 text-blue-600",
      icon: `<rect x="4" y="4.5" width="16" height="10.5" rx="1.3"/><path stroke-linecap="round" d="M2.5 19.5h19M9.5 19.5v-4.5M14.5 19.5v-4.5"/>`,
    },
    {
      name: "Home Appliances",
      subtitle: "Refrigerator, AC, Washing…",
      color: "bg-sky-50 text-sky-600",
      icon: `<rect x="4" y="2.5" width="16" height="19" rx="2"/><circle cx="12" cy="13.5" r="4.2"/><circle cx="12" cy="13.5" r="1.4"/><path stroke-linecap="round" d="M7.5 6h1M11 6h1"/>`,
    },
    {
      name: "Plumbing",
      subtitle: "Leakage, Installation, Repair…",
      color: "bg-blue-50 text-blue-600",
      icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M5 4.5h6v4.2a3 3 0 0 0 3 3H17M17 11.7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 0V19.5"/>`,
    },
    {
      name: "Others",
      subtitle: "More repair services",
      color: "bg-sky-50 text-sky-500",
      icon: `<circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none"/>`,
    },
  ];
  
  // ---- Render a single category row ----------------------------------------
  function categoryRow(cat) {
    return `
      <a href="#" class="category-row flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 sm:px-5 py-4 transition">
        <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${cat.color} flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${cat.icon}</svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-slate-900 text-sm sm:text-base">${cat.name}</div>
          <div class="text-xs sm:text-sm text-slate-400 truncate">${cat.subtitle}</div>
        </div>
        <svg class="w-5 h-5 text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6"/></svg>
      </a>
    `;
  }
  
  // ---- Render the full list, or an empty state if nothing matches ----------
  function renderCategories(list) {
    const listEl = document.getElementById("category-list");
    const emptyEl = document.getElementById("empty-state");
    if (!listEl) return;
    listEl.innerHTML = list.map(categoryRow).join("");
    if (emptyEl) emptyEl.classList.toggle("hidden", list.length > 0);
  }
  
  // ---- Filter categories by name or subtitle --------------------------------
  function filterCategories(query) {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)
    );
  }
  
  // Show the full list on load
  renderCategories(CATEGORIES);
  
  // Wire up every search input on the page (header bar, mobile row, drawer —
  // wherever one exists) to filter the same list live as the user types
  document.querySelectorAll('input[placeholder="Search for a service"]').forEach((input) => {
    input.addEventListener("input", (e) => {
      renderCategories(filterCategories(e.target.value));
    });
  });
  
  // ---- Mobile sidebar drawer -------------------------------------------------
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const menuBtn = document.getElementById("menu-btn");
  
  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove("-translate-x-full");
    if (backdrop) backdrop.classList.remove("hidden");
  }
  
  function closeSidebar() {
    if (!sidebar) return;
    // Below md it's an overlay drawer; from md up it's shown statically via CSS
    if (window.innerWidth < 768) {
      sidebar.classList.add("-translate-x-full");
    }
    if (backdrop) backdrop.classList.add("hidden");
  }
  
  if (menuBtn) menuBtn.addEventListener("click", openSidebar);
  if (backdrop) backdrop.addEventListener("click", closeSidebar);
  
  window.addEventListener("resize", () => {
    if (!sidebar) return;
    if (window.innerWidth >= 768) {
      sidebar.classList.remove("-translate-x-full");
      if (backdrop) backdrop.classList.add("hidden");
    } else {
      sidebar.classList.add("-translate-x-full");
    }
  });
