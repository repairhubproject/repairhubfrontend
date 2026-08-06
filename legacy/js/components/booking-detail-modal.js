// src/js/components/booking-detail-modal.js
//
// Shared modal for viewing a booking's detail via the real
// GET /bookings/:id endpoint. Used from the Repairs and Payments pages
// so "View Details" / "Arbitrate" / "Audit" all show real data instead
// of another static mock.

import { getBooking } from "../api/admin.js";

let modalEl = null;

function ensureModal() {
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "bookingDetailModal";
    modalEl.className = "fixed inset-0 z-[60] hidden items-center justify-center bg-black/50 p-4";
    modalEl.innerHTML = `
        <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-bold">Booking Detail</h3>
                <button id="bookingModalClose" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div id="bookingModalBody" class="space-y-4 text-sm"></div>
        </div>`;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (event) => {
        if (event.target === modalEl) closeBookingModal();
    });
    modalEl.querySelector("#bookingModalClose").addEventListener("click", closeBookingModal);

    return modalEl;
}

export function closeBookingModal() {
    modalEl?.classList.add("hidden");
    modalEl?.classList.remove("flex");
}

function currency(value) {
    if (value == null) return "—";
    return `₦${Number(value).toLocaleString("en-NG")}`;
}

function renderBooking(data) {
    const booking = data.booking || {};
    const updates = data.job_updates || [];
    const warranty = data.warranty;
    const payment = data.payment;

    return `
        <div>
            <p class="text-xs text-slate-500">Booking #${booking.id ?? "—"}</p>
            <h4 class="font-semibold">${booking.title || "Untitled repair job"}</h4>
            <p class="mt-1 text-xs text-slate-500">
                Status: <span class="font-semibold text-slate-700">${booking.status || "—"}</span>
                &middot; Quoted: <span class="font-semibold text-slate-700">${currency(booking.quoted_amount)}</span>
            </p>
        </div>

        <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Job Updates</p>
            ${
                updates.length
                    ? `<ul class="mt-2 space-y-2">${updates
                          .map(
                              (update) => `
                        <li class="rounded-lg border border-gray-100 bg-slate-50 p-2 text-xs">
                            <span class="font-semibold">${update.status}</span>${update.note ? ` — ${update.note}` : ""}
                            <span class="mt-0.5 block text-[10px] text-slate-400">
                                ${update.created_at ? new Date(update.created_at).toLocaleString() : ""}
                            </span>
                        </li>`
                          )
                          .join("")}</ul>`
                    : `<p class="mt-1 text-xs text-slate-400">No job updates yet.</p>`
            }
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Warranty</p>
                ${
                    warranty
                        ? `<p class="mt-1 text-xs text-slate-600">${warranty.duration_days} days — expires ${new Date(warranty.expires_at).toLocaleDateString()}</p>`
                        : `<p class="mt-1 text-xs text-slate-400">No warranty issued yet.</p>`
                }
            </div>
            <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment</p>
                ${
                    payment
                        ? `<p class="mt-1 text-xs text-slate-600">${currency(payment.amount)} — ${payment.status}</p>`
                        : `<p class="mt-1 text-xs text-slate-400">No payment recorded yet.</p>`
                }
            </div>
        </div>`;
}

export async function openBookingModal(bookingId) {
    const modal = ensureModal();
    const body = modal.querySelector("#bookingModalBody");

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    body.innerHTML = `<p class="text-slate-400">Loading booking #${bookingId}...</p>`;

    try {
        const data = await getBooking(bookingId);
        body.innerHTML = renderBooking(data);
    } catch (error) {
        body.innerHTML = `<p class="text-red-500">${error.message || "Unable to load this booking."}</p>`;
    }
}
