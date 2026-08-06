// REPAIRHUB ADMIN - REPAIR OPERATIONS & DISPUTES
//
// Table rows are static sample data (src/js/api/admin-mock.js) since no
// list endpoint exists for repairs/disputes yet. "View Details" and
// "Arbitrate" open the real booking record via GET /bookings/:id, which
// does exist — see components/booking-detail-modal.js.

import { requireAdmin, renderAdminLayout } from "./components/admin-layout.js";
import { openBookingModal } from "./components/booking-detail-modal.js";
import { MOCK_REPAIRS, MOCK_REPAIRS_SUMMARY } from "./api/admin-mock.js";

requireAdmin();

renderAdminLayout({
    active: "repairs",
    pageTitle: "Repair Operations & System Disputes",
    pageSubtitle: "Monitor repair life cycles, coordinate delivery handovers, and resolve active escrow disputes.",
});

const disputeBadge = {
    "Active Dispute": "bg-amber-100 text-amber-700",
    Resolved: "bg-emerald-100 text-emerald-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Delivered: "bg-slate-100 text-slate-600",
};

const tableBody = document.getElementById("repairsTableBody");
const resultsSummary = document.getElementById("resultsSummary");
const jobSearch = document.getElementById("jobSearch");
const viewButtons = document.querySelectorAll(".view-btn");

let currentView = "disputes";

function renderRows() {
    const query = jobSearch.value.trim().toLowerCase();
    const rows = MOCK_REPAIRS[currentView].filter((row) => !query || row.ref.toLowerCase().includes(query));

    tableBody.innerHTML = rows
        .map(
            (row) => `
        <tr class="border-b last:border-0">
            <td class="p-3 font-semibold text-blue-600">${row.ref}</td>
            <td class="p-3">${row.customer}</td>
            <td class="p-3">${row.technician}</td>
            <td class="p-3">${row.device}</td>
            <td class="p-3 font-bold">${row.cost}</td>
            <td class="p-3">
                <span class="rounded-full px-2 py-1 text-[10px] font-semibold ${disputeBadge[row.status] || "bg-slate-100 text-slate-600"}">
                    ${row.status}
                </span>
            </td>
            <td class="p-3 text-slate-500">${row.reason}</td>
            <td class="p-3 text-right">
                <button data-booking-id="${row.bookingId}" class="action-btn rounded-lg px-4 py-2 text-xs font-semibold ${
                    row.action === "Arbitrate" ? "bg-blue-600 text-white" : "border border-gray-200 text-slate-600"
                }">
                    ${row.action}
                </button>
            </td>
        </tr>`
        )
        .join("");

    resultsSummary.textContent = MOCK_REPAIRS_SUMMARY[currentView];
}

viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        viewButtons.forEach((b) => {
            b.classList.remove("bg-[#0f172a]", "text-white");
            b.classList.add("text-slate-500");
        });
        btn.classList.add("bg-[#0f172a]", "text-white");
        btn.classList.remove("text-slate-500");

        currentView = btn.dataset.view;
        renderRows();
    });
});

jobSearch.addEventListener("input", renderRows);

tableBody.addEventListener("click", (event) => {
    if (!event.target.classList.contains("action-btn")) return;
    openBookingModal(event.target.dataset.bookingId);
});

renderRows();
