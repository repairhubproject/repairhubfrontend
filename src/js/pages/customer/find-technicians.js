import { getTechnicians } from "../../api/technicians.js";
import {generateRatingStars} from '../../utils/generating-star-rating.js'
import {isNewTechnician} from '../../utils/is-new-technician.js'
import { getCategories } from "../../api/categories.js";

const filters = {
  category: "",
  search: "",
  lat: "",
  lng: "",
};

const categoriesContainer = document.getElementById("categories-container");

async function renderUi() {

  try {
    const categories = await getCategories();

    renderCategories(categories)

  } catch (error) {
    // Error state
    console.error(error);
  }
}

renderUi();

function renderCategories(categories) {


  let html = "";

  html += `
    <option value="">All Categories</option>
  `;

  categories.forEach((category) => {
    html += `
     <option value="${category.slug}">${category.name}</option>
    `;
  });

  categoriesContainer.innerHTML = html;
}


  // find techicians

const techniciansContainer = document.getElementById("technicians-container");

async function fetchTechnicians() {

  techniciansContainer.innerHTML =
    "<p class='text-center w-full py-50'>Loading technicians...</p>";

  try {
    const technicians = await getTechnicians(filters);


    renderTechnicians(technicians);

  } catch (error) {

    techniciansContainer.innerHTML = `
      <div class="text-center py-50 w-full">
          <p class="text-red-500 mb-3">
              Failed to load categories.
          </p>

          <button
              id="retry-btn"
              class="px-4 py-2 bg-blue-600 text-white rounded"
          >
              Try Again
          </button>
      </div>
  `;

    document.getElementById("retry-btn").addEventListener("click", fetchTechnicians);

    console.error(error);
  }
}

fetchTechnicians()


// rendering technicians
function renderTechnicians(technicians) {
  techniciansContainer.innerHTML = "";

  if (technicians.length === 0) {
    techniciansContainer.innerHTML =
      "<p class='text-center w-full py-50'>No technicians found.</p>";

    return;
  }
  

  technicians.forEach((technician) => {
    techniciansContainer.innerHTML += `
      <a href="/pages/customer/technician-profile.html?id=${technician.id}" class="shadow-[0px_3px_3px_rgba(0,0,0,0.1)] hover:border-[#2563EB] cursor-pointer transition-all duration-300 ease rounded-lg border border-gray-300 px-4 py-5">
        <div class="space-y-2 pb-10 border-b border-gray-300">
          <div class="space-x-2 flex items-center">
            <h2 class="font-semibold text-md md:text-lg">${technician.name}</h2>
            ${technician.verification_status ? ' <i class="ph-bold ph-seal-check text-[#2563EB] text-xl"></i>' : ""}
           
          </div>
          <div class="space-x-2 flex items-center">
            <div class="flex gap-0.5 text-gray-300">
              ${generateRatingStars(Number(technician.rating_avg))}
            </div>
            ${isNewTechnician(technician.created_at) ? '<span class="text-gray-500 text-sm">New</span>' :
              ""
            }
            
          </div>
        </div>
        <div class="flex gap-1 pt-3 text-gray-500">
          <i class="ph-fill ph-gps-fix text-xl"></i>
          <span class="text-sm md:text-base">Nigeria</span>
        </div>
      </a>
    `;
  });
}

  // search by location
document.getElementById('nearby-btn').addEventListener('click', getUserLocation)

function getUserLocation() {

  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition((position) => {

      filters.lat = position.coords.latitude;

      filters.lng = position.coords.longitude;

      fetchTechnicians();

  });

}

      // search by category list
const categorySelect = document.getElementById("categories-container");

categorySelect.addEventListener("change", () => {
  
    filters.category = categorySelect.value;

    fetchTechnicians();

});

// find technician with search-box

const searchBox = document.getElementById("search-box");
const searchBtn = document.getElementById("search-btn");

searchBtn.addEventListener("click", () => {
  // Get what the user typed
  filters.search = searchBox.value.trim();

  // Fetch technicians again using the new search value
  fetchTechnicians();
});