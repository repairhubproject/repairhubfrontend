// REPAIRHUB ADMIN - FINANCIAL LEDGER
//
// Ledger rows are static sample data (src/js/api/admin-mock.js) since no
// escrow/payout list endpoint exists yet. "Audit" opens the real booking
// record via GET /bookings/:id, which does exist. Payout-mutating actions
// (Release Pay, bulk approve/hold, export, trigger payout) stay stubbed
// since no write endpoint exists for them yet.

import { requireAdmin, renderAdminLayout } from "./components/admin-layout.js";
import { openBookingModal } from "./components/booking-detail-modal.js";
import { MOCK_LEDGER } from "./api/admin-mock.js";

requireAdmin();

renderAdminLayout({
    active: "payments",
    pageTitle: "Financial Ledger & Revenue Audit",
    pageSubtitle: "Audit escrow pools, verify platform commission splits, and initiate technician payouts.",
});

const clearanceBadge = {
    "Cleared for Release": "bg-emerald-100 text-emerald-700",
    "Pending Dispute Review": "bg-amber-100 text-amber-700",
    "Escrow Locked": "bg-red-100 text-red-700",
};

const tableBody = document.getElementById("ledgerTableBody");
const txSearch = document.getElementById("txSearch");
const selectAll = document.getElementById("selectAll");

function renderRows() {
    const query = txSearch.value.trim().toLowerCase();
    const rows = MOCK_LEDGER.filter((row) => !query || row.tx.toLowerCase().includes(query));

    tableBody.innerHTML = rows
        .map(
            (row) => `
        <tr class="border-b last:border-0">
            <td class="p-3"><input type="checkbox" class="row-check"></td>
            <td class="p-3 font-semibold text-blue-600">${row.tx}</td>
            <td class="p-3 text-blue-600">${row.job}</td>
            <td class="p-3">${row.provider}</td>
            <td class="p-3">${row.gross}</td>
            <td class="p-3 text-slate-500">${row.commission}</td>
            <td class="p-3 font-bold text-emerald-600">${row.net}</td>
            <td class="p-3">
                <span class="rounded-full px-2 py-1 text-[10px] font-semibold ${clearanceBadge[row.status] || "bg-slate-100 text-slate-600"}">
                    ● ${row.status}
                </span>
            </td>
            <td class="p-3 text-right">
                <button data-booking-id="${row.bookingId}" data-action="${row.action}" class="action-btn rounded-lg px-4 py-2 text-xs font-semibold ${
                    row.action === "Release Pay" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                }">
                    ${row.action}
                </button>
            </td>
        </tr>`
        )
        .join("");
}

txSearch.addEventListener("input", renderRows);

selectAll.addEventListener("change", () => {
    document.querySelectorAll(".row-check").forEach((box) => (box.checked = selectAll.checked));
});

function notConnected() {
    alert("This action requires a payout/escrow write endpoint that is not yet available.");
}

tableBody.addEventListener("click", (event) => {
    if (!event.target.classList.contains("action-btn")) return;

    if (event.target.dataset.action === "Audit") {
        openBookingModal(event.target.dataset.bookingId);
    } else {
        notConnected();
    }
});

document.getElementById("approveSelectedBtn").addEventListener("click", notConnected);
document.getElementById("holdSelectedBtn").addEventListener("click", notConnected);
document.getElementById("exportStatementBtn").addEventListener("click", notConnected);
document.getElementById("bulkPayoutBtn").addEventListener("click", notConnected);

renderRows();
