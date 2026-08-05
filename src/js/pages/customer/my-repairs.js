
import {getMyRepairRequests} from "../../api/my-repairs-api.js";
import {formatTimeAgo} from "../../utils/format-time.js"
import {getLocationFromCoordinates} from '../../api/location.js'
import {getStatusClass, formatStatus} from '../../utils/get-Status-Class.js'

const repairsContainer =
  document.getElementById(
    "repairs-container"
  );

  async function loadMyRepairs() {
  try {
    // Loading state
    repairsContainer.innerHTML = `
      <p class="py-10 text-center">
        Loading your repair requests...
      </p>
    `;

    // Get the customer's requests
    const requests =
      await getMyRepairRequests();

      console.log(requests)

    // Render the requests
    await renderMyRepairs(requests);

  } catch (error) {
    console.error(error);

    // Error state
    repairsContainer.innerHTML = `
      <div class="py-10 text-center text-gray-500">
        <p>
          Unable to load your repair requests.
        </p>

        <button
          id="retry-button"
          type="button"
          class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    `;

    const retryButton =
      document.getElementById(
        "retry-button"
      );

    retryButton.addEventListener(
      "click",
      loadMyRepairs
    );
  }
}

loadMyRepairs()


async function renderMyRepairs(requests) {
  // Empty state
  if (requests.length === 0) {

    repairsContainer.innerHTML = `
      <div class="py-12 text-center">
        <h2 class="text-xl font-semibold">
          No repair requests yet
        </h2>

        <p class="mt-2 text-gray-500">
          Your repair requests will appear here.
        </p>

        <a
          href="/pages/customer/request-repair.html"
          class="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white"
        >
          Request a Repair
        </a>
      </div>
    `;

    return;
  }

  // Render all requests
  let html = "";

  for (const request of requests) {
    
    // const locationData =
    //   await getLocationFromCoordinates(
    //     request.lat,
    //     request.lng
    //   );

    //   console.log(locationData)


    html += `
      <a href="/pages/customer/repair-details.html?id=${request.id}" class="p-2 md:p-5 border-b border-gray-300 flex w-full justify-between items-center cursor-pointer hover:bg-blue-100 transition-all duration-300 ease">
        <div class="space-y-1">
          <h3 class="font-bold text-base md:text-md">${request.title}</h3>
        <p class="text-gray-500 text-sm"><span>${request.category_name}</span> . <span>Nigeria</span> . <span>${formatTimeAgo(request.created_at)}</span></p>
        </div>
        <div class="py-1 text-sm px-3 rounded-2xl font-semibold ${getStatusClass(request.status)}">${formatStatus(request.status)}</div>
      </a>
    `;
  }

  repairsContainer.innerHTML = html;
}