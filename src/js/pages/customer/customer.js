import { getNearbyTechnicians, getTechnicianById} from "../../api/customers-api.js";
import {generateRatingStars} from '../../utils/generating-star-rating.js'

const user = JSON.parse(localStorage.getItem("user"));

const avatar = document.getElementById("profile-avatar");
const greeting = document.getElementById("profile-name");

if (user) {
  avatar.textContent = user.name.charAt(0).toUpperCase();
  greeting.textContent = `Hi, ${user.name.split(" ")[0]}`;
}

const nearbyTechniciansContainer = document.getElementById(
  "nearby-technicians-container",
);

// fetching technicians
async function fetchAndRenderNearbyTechnicians(lat, lng) {

  // Loading state
  nearbyTechniciansContainer.innerHTML = `
    <p class="col-span-full py-10 text-center">
      Finding technicians near you...
    </p>
  `;

  try {
    // Get technicians using the user's location
    const data = await getNearbyTechnicians(lat, lng);


    // Get only the first three technicians
    const nearbyTechnicians = data.technicians.slice(0, 4);

    const techniciansWithDetails = await Promise.all(
        nearbyTechnicians.map(async (technician) => {
        const details = await getTechnicianById(technician.id);

        console.log(details)

        return {
          ...technician,
          reviews: details.technician.reviews || [],
        };
      })
    );


    // Check if no technicians were returned
    if (nearbyTechnicians.length === 0) {
      nearbyTechniciansContainer.innerHTML = `
        <p class="col-span-full w-full py-10 text-center">
          No technicians were found near you.
        </p>
      `;

      return;
    }

    renderNearbyTechnicians(techniciansWithDetails);

  } catch (error) {
    console.error(error);

    nearbyTechniciansContainer.innerHTML = `
      <p class="col-span-full text-center py-10 text-red-500">
        Unable to load nearby technicians.
      </p>
    `;
  }
}


    // render nearby technicians
function renderNearbyTechnicians(technicians) {

  let html = "";



  technicians.forEach((technician) => {
    html += `
      <div
        class="flex items-center justify-between rounded-2xl bg-white px-2 md:px-4 py-4 gap-3 shadow-[0_5px_8px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_6px_18px_rgba(0,0,0,0.15)]"
      >
        <div class="flex items-center gap-4">
          <div class="relative">
            <div
              class="w-16 h-16 bg-slate-300 rounded-full md:h-[94px] md:w-[94px] flex items-center justify-center font-bold text-4xl md:text-2xl"
            >
              ${technician.name.charAt(0).toUpperCase()}
            </div>
            ${technician.is_available ? '<span class="absolute bottom-1 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"></span>' : '' }
            
          </div>

          <div>
            <h3 class="text-md md:text-3xl font-bold text-black">
              ${technician.name}
            </h3>

            <div class="flex-col flex gap-1 text-xs text-black">
            ${technician.categories.length === 0 ? technician.categories.map((category) => {
              return `<p class="text-sm md:text-lg font-medium text-black">${category}</p>`
            
            }).join("")
              : '<p class="text-sm md:text-lg font-medium text-black">Not specified </p>'}

              <div class="flex items-center gap-1">
                <i
                  class="ph-fill ph-star text-[12px] text-yellow-400"
                ></i>
                <span>${technician.rating_avg}</span>
                <span>(${technician.reviews.length} reviews)</span>
              </div>

              <div class="flex items-center gap-1">
                <i class="ph ph-map-pin text-[12px]"></i>
                <span>${technician.service_radius_km} km away</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col justify-between gap-5">
          <span
            class="rounded-full bg-blue-50 px-3 py-1 text-xs text-center font-semibold text-blue-600 shadow-[0_1px_8px_rgba(0,0,0,0.2)]"
          >
            ${technician.is_available ? 'Avaliable' : ''}
          </span>

          <a
            href="/pages/customer/technician-profile.html?id=${technician.id}"
            class="flex items-center gap-1 text-xs md:text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            See Profile

            <i class="ph ph-caret-right md:text-xs"></i>
          </a>
        </div>
      </div>
    `;
  });

  nearbyTechniciansContainer.innerHTML = html;
}

function getUserLocation() {
  if (!navigator.geolocation) {

    nearbyTechniciansContainer.innerHTML = `
      <p class="col-span-full text-center">
        Your browser does not support location services.
      </p>
    `;

    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      fetchAndRenderNearbyTechnicians(lat, lng);
    },

    (error) => {
      console.error(error);

      nearbyTechniciansContainer.innerHTML = `
        <p class="col-span-full text-center">
          We could not access your location.
        </p>
      `;
    }
  );
}

getUserLocation();