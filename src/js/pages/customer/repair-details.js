import {
  getRepairRequest,
  getRequestQuotations,
  cancelRepairRequest,
  acceptQuotation,
} from "../../api/repair-details-api.js";
import { timeAgo } from "../../utils/format-time.js";
import { getStatusClass, formatStatus } from "../../utils/get-Status-Class.js";
import { generateRatingStars } from "../../utils/generating-star-rating.js";

const requestId = new URLSearchParams(window.location.search).get("id");

async function loadRequestDetails() {
  try {
    const request = await getRepairRequest(requestId);

    const quotations = await getRequestQuotations(requestId);

    renderRequest(request);

    console.log(request);

    renderRequestStatusContent(request, quotations);
  } catch (error) {
    console.error(error);
  }
}

loadRequestDetails();

const requestContainer = document.getElementById("request-details");

function renderRequest(request) {
  const postedTime = timeAgo(request.created_at);
  requestContainer.innerHTML = `

   <div class="w-full flex justify-between items-center">
      <div class="space-y-1">
        <h1 class="text-md md:text-xl font-bold">${request.title}</h1>
        <p class="text-gray-500"><span>${request.category_name}</span> . <span>posted ${postedTime}</span></p>
      </div>
      <div class="flex gap-4">
        ${
          request.status === "open"
            ? `<button data-request-id="${request.id}" class="cancel-request-btn py-1 flex gap-1 items-center text-sm px-3 rounded-lg border border-red-300 bg-red-100 text-red-600 font-semibold cursor-pointer hover:bg-red-300 transition-all duration-300 ease">
          <i class="ph-bold ph-x-circle text-xl md:text-2xl"></i>
          <span>cancel</span>
        </button>`
            : ""
        }
        
      </div>
    </div>
    <div class="w-full mb-5 p-6 flex gap-5 justify-between shadow-[0px_3px_5px_rgba(0,0,0,0.1)] border items-center border-gray-300 rounded-lg bg-white">
      <div class="space-y-1">
        <p class="break-words">${request.description}</p>
        <div class="flex items-center gap-2 text-gray-500">
          <i class="ph-bold ph-gps-fix"></i>
          <span class="">Nigeria</span>
        </div>
      </div>
      <div class="py-1 text-sm px-3 rounded-2xl border border-[rgba(193,211,249,0.8)] bg-[rgba(193,211,249,0.3)] text-[#2563EB] ${getStatusClass(request.status)}">${formatStatus(request.status)}</div>
    </div>
  `;
}

requestContainer.addEventListener("click", async (event) => {
  const cancelRequestButton = event.target.closest(".cancel-request-btn");

  // Stop if the clicked element is not
  // the cancel button
  if (!cancelRequestButton) {
    return;
  }

  // Get the ID from the clicked button
  const requestId = cancelRequestButton.dataset.requestId;

  // Ask for confirmation
  const shouldCancel = confirm(
    "Are you sure you want to cancel this repair request?",
  );

  // Stop if the user clicks Cancel
  if (!shouldCancel) {
    return;
  }

  try {
    // Prevent multiple clicks
    cancelRequestButton.disabled = true;

    cancelRequestButton.innerHTML = `
        <span> Cancelling...</span>
      `;

    // Send PATCH request
    const updatedRequest = await cancelRepairRequest(requestId);

    alert("Repair request cancelled successfully.");

    // Reload so the new status is shown
    window.location.reload();
  } catch (error) {
    console.error(error);

    alert(error.message || "Unable to cancel this repair request.");

    // Restore the button
    cancelRequestButton.disabled = false;
  }
});

const requestStatusContainer = document.getElementById(
  "request-status-content",
);

function renderRequestStatusContent(request, quotations) {

  const status = request.status?.toLowerCase();

  // OPEN REQUEST
  if (status === "open") {
    if (quotations.length > 0) {
      renderQuotations(quotations);
    } else {
      requestStatusContainer.innerHTML = `
        <div
          class="
            mt-6
            rounded-xl
            border
            border-gray-200
            bg-gray-50
            p-6
            text-center
          "
        >

          <h2 class="font-semibold">
            No quotations yet
          </h2>

          <p class="mt-2 text-sm text-gray-500">
            Technicians have not submitted
            quotations for this repair yet.
          </p>

        </div>
      `;
    }

    return;
  }

  // BOOKED OR IN PROCESS

  if (status === "booked" || status === "in_process") {
    const acceptedQuotation = quotations.find(
      (quotation) => quotation.status === "accepted",
    );
    if (acceptedQuotation) {
      // Reuse the same function,
      // but send only the accepted quote
      renderQuotations([acceptedQuotation]);
    } else {
      requestStatusContainer.innerHTML = `
        <p class="text-center text-gray-500">
          The selected technician
          is unavailable.
        </p>
      `;
    }

    return;
  }

  // CANCELLED
  if (status === "cancelled") {
    requestStatusContainer.innerHTML = `
      <div
        class="
          mt-6
          rounded-xl
          border
          border-red-300
          bg-red-50
          p-6
          text-center
        "
      >

        <h2
          class="
            font-semibold
            text-red-700
          "
        >
          Repair Request Cancelled
        </h2>

        <p
          class="
            mt-2
            text-sm
            text-red-600
          "
        >
          This repair request has been
          cancelled. No further action
          is required.
        </p>

      </div>
    `;

    return;
  }

  // COMPLETED
  if (status === "completed") {
    requestStatusContainer.innerHTML = `
      <div class="
          mt-6
          rounded-xl
          border
          border-green-300
          bg-green-50
          p-6
        "
      >

        <h2
          class="
            font-semibold
            text-green-700
          "
        >
          Repair Completed
        </h2>

        <p
          class="
            mt-2
            text-sm
            text-green-600
          "
        >
          This repair has been marked
          as completed.
        </p>

        <button
          type="button"
          class="
            mt-4
            rounded-lg
            bg-green-600
            px-4
            py-2
            text-white
          "
        >
          Leave a Review
        </button>

      </div>
    `;

    return;
  }

  // UNKNOWN STATUS
  requestStatusContainer.innerHTML = `
    <p
      class="
        mt-6
        text-center
        text-gray-500
      "
    >
      Request status is unavailable.
    </p>
  `;
}

function getQuotationHeading(quotations) {
  // Check if any quotation is accepted
  const acceptedQuotation = quotations.find(
    (quotation) => quotation.status?.toLowerCase() === "accepted",
  );

  // If a technician has been selected
  if (acceptedQuotation) {
    return `
      Selected Technician
    `;
  }

  // Default heading
  return `
    Quotations (${quotations.length})
  `;
}

function getQuotationAction(quotation) {
  const status = quotation.status?.toLowerCase();

  // Show the booking button
  if (status === "pending" || !status) {
    return `
      <button
        data-quotation-id="${quotation.id}"
        type="button"
        class="
          select-technician-btn
          px-5
          py-2.5
          text-sm
          md:text-base
          text-white
          bg-[#2563EB]
          rounded-lg
          hover:bg-blue-800
          transition-all
          duration-300
          ease
        "
      >
        Select & Book
      </button>
    `;
  }

  // Show accepted tag
  if (status === "accepted") {
    return `
      <span
        class="
          inline-flex
          items-center
          gap-1
          rounded-lg
          border
          border-green-600
          bg-green-50
          px-5
          py-2.5
          text-sm
          md:text-base
          font-semibold
          text-green-700
        "
      >
        <i class="ph-bold ph-check"></i>
        Accepted
      </span>
    `;
  }

  // Fallback for an unknown status
  return `
    <span
      class="
        inline-flex
        items-center
        rounded-lg
        border
        border-gray-300
        px-5
        py-2.5
        text-sm
        text-gray-500
      "
    >
      ${quotation.status}
    </span>
  `;
}

function renderQuotations(quotations) {
  let html = "";

  html += `<h1 class="text-md md:text-xl font-bold">${getQuotationHeading(quotations)}</h1>`;

  quotations.forEach((quotation) => {
    html += `
        <div class="w-full mb-5 p-6 shadow-[0px_3px_5px_rgba(0,0,0,0.1)] border-2 border-[#2563EB] rounded-xl bg-white">
          <div class="w-full border-b border-gray-300 pb-4">

            <div class="flex justify-between items-center mb-5">
              <div class="flex items-center gap-2">
                <div class="w-16 h-16 bg-slate-300 rounded-full md:h-[94px] md:w-[94px] flex items-center justify-center font-bold text-4xl md:text-2xl">${quotation.technician_name.charAt(0).toUpperCase()}</div>
                <div class="space-y-1">
                  <div class="flex items-center gap-1">
                    <p class="text-sm md:text-base font-semibold">${quotation.technician_name}</p>
                    <i class="ph-fill ph-seal-check text-xl md:text-2xl text-[#2563EB]"></i>
                  </div>
                  <div class="flex gap-2 items-center">
                    <div>
                      ${generateRatingStars(Number(quotation.rating_avg))}
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-md md:text-2xl font-bold">#${quotation.amount}</p>
            </div>
            <div><p class="text-sm md:text-base text-gray-500 w-50 md:w-100  truncate">${quotation.message}</p></div>
          </div>
          <div class="w-full pt-4 flex justify-between items-center">
            <div class="flex items-center gap-1">
              <i class="ph-bold ph-clock text-xl"></i>
              <p class="text-sm md:text-base text-gray-500">${quotation.estimated_days} days</p>
            </div>
           ${getQuotationAction(quotation)}
          </div>
        </div>
      `;
  });

  quotationContainer.innerHTML = html;
}

function addSelectTechnicianEvents() {
  const selectButtons = document.querySelectorAll(".select-technician-btn");

  selectButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const quotationId = button.dataset.quotationId;

      const confirmed = confirm(
        "Are you sure you want to select this technician?",
      );

      if (!confirmed) {
        return;
      }

      try {
        button.disabled = true;

        button.textContent = "Selecting...";

        const booking = await acceptQuotation(quotationId);

        console.log("Booking:", booking);

        alert("Technician selected successfully.");

        // Reload to show the booked state
        window.location.reload();
      } catch (error) {
        console.error(error);

        alert(error.message || "Unable to select technician.");
      }
    });
  });
}

function renderAcceptedTechnician(request) {
  const technician = request.technician;

  if (!technician) {
    requestStatusContainer.innerHTML = `
      <p>
        Technician information is
        unavailable.
      </p>
    `;

    return;
  }

  requestStatusContainer.innerHTML = `
    <section
      class="
        mt-6
        rounded-xl
        border
        border-blue-200
        bg-blue-50
        p-6
      "
    >

      <p
        class="
          text-sm
          text-blue-600
        "
      >
        Accepted Technician
      </p>

      <h2
        class="
          mt-1
          text-xl
          font-bold
        "
      >
        ${technician.name}
      </h2>

      <p
        class="
          mt-2
          text-sm
        "
      >
        ${technician.phone}
      </p>

    </section>
  `;
}
