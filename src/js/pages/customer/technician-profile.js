import {getTechnicianById} from '../../api/technicians.js'

const profileContainer = document.querySelector(
  "#technician-profile"
);

async function loadTechnicianProfile() {
  try {
    // Get the query parameters from the URL
    const params = new URLSearchParams(
      window.location.search
    );

    // Get the value of "id"
    const technicianId = params.get("id");

    // Check if an ID exists
    if (!technicianId) {
      profileContainer.innerHTML = `
        <p class="text-center text-red-500 py-50 w-full">
          Technician ID was not provided.
        </p>
      `;

      return;
    }

    // Fetch the technician using the ID
    const response = await getTechnicianById(
      technicianId
    );

    console.log(response);

    // Get the technician from the API response
    const technician = response.technician;

    // Render the technician
    renderTechnicianProfile(technician);

  } catch (error) {
    console.error(error);

    profileContainer.innerHTML = `
      <p class="text-center text-red-500">
        Unable to load this technician's profile.
      </p>
    `;
  }
}

function renderTechnicianProfile(technician) {

  profileContainer.innerHTML = `
   <div class="flex gap-6 items-center mb-10 flex-col lg:flex-row">
    <div class="md:w-[210px] md:h-[200px] h-[150px] w-[150px] rounded-full bg-slate-300 flex items-center justify-center font-bold text-4xl md:text-6xl">
      ${technician.name.charAt(0).toUpperCase()}
    </div>
    <div class="flex flex-col gap-3 max-md:items-center">
      <h2 class="md:text-xl text-base font-bold">${technician.name}</h2>
      <div class="flex gap-3 items-center">
        <img src="../../src/assets/images/fluent-emoji-flat_star.png" alt="">
        <p class="md:text-lg text-sm text-black rating">
          ${technician.rating_avg} (<span>${technician.reviews.length}</span> reviews)
        </p>
      </div>
      <p class="md:text-lg text-sm text-black rating">${technician.skill || 'skills not specified'}</p>
      <div class="flex  gap-4 items-center">              
        <div class="flex gap-1 items-center">
          <i class="ph ph-map-pin text-lg"></i>
          <p class="text-sm md:text-base text-black">${technician.address || 'not specified'}</p>
        </div>
        <span class="text-sm md:text-base text-black bg-[#AEF1CB] py-1.5 px-3 rounded-4xl">${technician.is_available ? 'Avaliable today' : 
          ''}
        </span>
      </div>
      
      <div class="flex gap-3 max-md:justify-center max-sm:flex-col">
        <a href="/pages/customer/request-repair.html" class="bg-[#2563EB] sm:px-7 py-4 px-4 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.2)] transition-all duration-300 hover:shadow-[0_6px_18px_rgba(0,0,0,0.15)] text-sm md:text-lg text-white font-bold active:scale-95 text-center">
          Request repair
        </a>
        <a href="#" class="bg-white sm:px-7 py-4 px-4 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.2)] transition-all border border-[#2563EB] duration-300 hover:shadow-[0_6px_18px_rgba(0,0,0,0.15)] text-sm md:text-lg text-[#2563EB] font-bold active:scale-95">
          Message technician
        </a>
      </div>
    </div>
  </div>

    <div class="flex-col gap-10 flex  mb-20 md:mb-10">
      <div class="md:border md:border-[#2563EB] md:p-4 w-full max-md:bg-[#D9D9D9] flex justify-between items-center md:rounded-2xl rounded-4xl overflow-hidden">

        <button class="profile-tab md:text-[#2563EB] transition-all duration-200 ease cursor-pointer md:rounded-2xl rounded-4xl max-md:flex-1 max-md:py-4 text-black max-md:bg-[#2563EB] max-md:text-white  text-base font-semibold" data-tab="about">About</button>

        <button class="profile-tab md:rounded-2xl transition-all duration-200 ease cursor-pointer rounded-4xl text-black max-md:py-4 max-md:flex-1 text-base font-semibold" data-tab="reviews">Reviews</button>

        <button class="profile-tab md:rounded-2xl transition-all duration-200 ease cursor-pointer rounded-4xl text-black text-base max-md:py-4 max-md:flex-1 font-semibold" data-tab="services">Services</button>
      </div>
      <div class="w-full items-start flex gap-8 max-md:flex-col">
        <div class="flex-1 flex gap-8 flex-col md:flex-row justify-between">
          <div class="md:w-1/2 w-full text-justify ">
            <h1 class="text-xl font-bold">About John Doe</h1>
            <p class="text-base text-black">
              John Doe is a highly skilled laptop repair specialist with over 5 years of experience. He is known for his quick response time and high-quality work.
            </p>
          </div>
          <ul class="flex flex-col gap-3 md:w-1/2 w-full">
            <li class="flex gap-2 items-center text-sm md:text-base text-black">
              <i class="ph ph-seal-check text-[#2563EB]"></i>
              <p>Certified and Experienced Technician</p>
            </li>
            <li class="flex gap-2 items-center text-sm md:text-base text-black">
              <i class="ph ph-seal-check text-[#2563EB]"></i>
              <p>21 days repair guarantee</p>
            </li>
            <li class="flex gap-2 items-center text-sm md:text-base text-black">
              <i class="ph ph-seal-check text-[#2563EB]"></i>
              <p>quality parts used</p>
            </li>
            <li class="flex gap-2 items-center text-sm md:text-base text-black">
              <i class="ph ph-seal-check text-[#2563EB]"></i>
              <p>fast and reliable service</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

loadTechnicianProfile();

profileContainer.addEventListener(
  "click",
  (event) => {
    const clickedButton = event.target.closest(".profile-tab");

    // If the clicked element is not a tab,
    // stop the function
    if (!clickedButton) return;

    // Get all the tab buttons
    const tabButtons =
      profileContainer.querySelectorAll(
        ".profile-tab"
      );

    // Remove active style from every button
    tabButtons.forEach((button) => {
      button.classList.remove(
        "max-md:bg-[#2563EB]",
        "max-md:text-white"
      );
    });

    // Add active style to the clicked button
    clickedButton.classList.add(
      "max-md:bg-[#2563EB]",
      "max-md:text-white"
    );

    // Get the tab name
    const selectedTab =
      clickedButton.dataset.tab;

    // Render the correct technician data

    // if (selectedTab === "about") {
    //   renderAbout(currentTechnician);
    // }

    // if (selectedTab === "services") {
    //   renderServices(currentTechnician);
    // }

    // if (selectedTab === "reviews") {
    //   renderReviews(currentTechnician);
    // }
  }
);

