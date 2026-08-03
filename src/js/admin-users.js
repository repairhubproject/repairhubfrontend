// REPAIRHUB ADMIN - USERS & VERIFICATION QUEUE

import { requireAdmin, renderAdminLayout } from "./components/admin-layout.js";
import { getUsers, getTechnicians, verifyTechnician } from "./api/admin.js";

requireAdmin();

renderAdminLayout({
    active: "users",
    pageTitle: "Users & Technician Verification",
    pageSubtitle: "Manage platform accounts and review technician KYC documents before approval.",
});

// TAB SWITCHING

const tabButtons = document.querySelectorAll(".tab-btn");
const panels = {
    users: document.getElementById("panel-users"),
    verification: document.getElementById("panel-verification"),
};

tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        tabButtons.forEach((b) => {
            b.classList.remove("border-blue-600", "text-blue-600");
            b.classList.add("border-transparent", "text-slate-500");
        });
        btn.classList.add("border-blue-600", "text-blue-600");
        btn.classList.remove("border-transparent", "text-slate-500");

        Object.values(panels).forEach((p) => p.classList.add("hidden"));
        panels[btn.dataset.tab].classList.remove("hidden");
    });
});

// ALL USERS

let allUsers = [];

const usersTableBody = document.getElementById("usersTableBody");
const usersEmptyState = document.getElementById("usersEmptyState");
const usersLoadingState = document.getElementById("usersLoadingState");
const userCount = document.getElementById("userCount");
const userSearch = document.getElementById("userSearch");
const roleFilter = document.getElementById("roleFilter");

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

const roleBadgeClasses = {
    admin: "bg-blue-100 text-blue-700",
    technician: "bg-emerald-100 text-emerald-700",
    customer: "bg-slate-100 text-slate-600",
};

function renderUsers() {
    const query = userSearch.value.trim().toLowerCase();
    const role = roleFilter.value;

    const filtered = allUsers.filter((user) => {
        const matchesRole = role === "all" || user.role === role;
        const matchesQuery =
            !query ||
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query);
        return matchesRole && matchesQuery;
    });

    usersTableBody.innerHTML = filtered
        .map(
            (user) => `
        <tr class="border-b last:border-0">
            <td class="p-3 font-medium">${user.name || "—"}</td>
            <td class="p-3 text-slate-500">${user.email || "—"}</td>
            <td class="p-3 text-slate-500">${user.phone || "—"}</td>
            <td class="p-3">
                <span class="rounded px-2 py-1 text-[10px] font-semibold ${roleBadgeClasses[user.role] || "bg-slate-100 text-slate-600"}">
                    ${(user.role || "unknown").toUpperCase()}
                </span>
            </td>
            <td class="p-3 text-slate-500">${formatDate(user.created_at)}</td>
        </tr>`
        )
        .join("");

    usersEmptyState.classList.toggle("hidden", filtered.length !== 0);
    userCount.textContent = `Showing ${filtered.length} of ${allUsers.length} users`;
}

async function loadUsers() {
    try {
        const data = await getUsers();
        allUsers = data.users || [];
        renderUsers();
    } catch (error) {
        usersEmptyState.textContent = error.message || "Unable to load users.";
        usersEmptyState.classList.remove("hidden");
    } finally {
        usersLoadingState.classList.add("hidden");
    }
}

userSearch.addEventListener("input", renderUsers);
roleFilter.addEventListener("change", renderUsers);

// TECHNICIAN VERIFICATION QUEUE

const techList = document.getElementById("techList");
const techEmptyState = document.getElementById("techEmptyState");
const techLoadingState = document.getElementById("techLoadingState");
const pendingBadge = document.getElementById("pendingBadge");
const statusButtons = document.querySelectorAll(".status-btn");

let currentStatus = "pending";

function technicianCard(profile) {
    const name = profile.name || profile.user?.name || "Unnamed Technician";
    const email = profile.email || profile.user?.email || "—";
    const phone = profile.phone || profile.user?.phone || "—";
    const documentUrl = profile.id_document_url;
    const isPending = currentStatus === "pending";

    return `
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" data-id="${profile.id}">
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="text-sm font-bold">${name}</h3>
                    <p class="text-xs text-slate-500">${profile.account_name || "—"}</p>
                </div>
                <span class="rounded-full px-2 py-1 text-[10px] font-semibold ${
                    currentStatus === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : currentStatus === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                }">
                    ${currentStatus.toUpperCase()}
                </span>
            </div>

            <div class="mt-3 space-y-1 text-xs text-slate-500">
                <p>Email: ${email}</p>
                <p>Phone: ${phone}</p>
            </div>

            ${
                documentUrl
                    ? `<a href="${documentUrl}" target="_blank" rel="noopener" class="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline">
                        View ID Document
                    </a>`
                    : `<p class="mt-3 text-xs text-slate-400">No document uploaded</p>`
            }

            ${
                isPending
                    ? `<div class="mt-4 flex gap-2">
                        <button class="approve-btn flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                            Approve
                        </button>
                        <button class="reject-btn flex-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                            Reject
                        </button>
                    </div>`
                    : ""
            }
        </div>`;
}

async function loadTechnicians() {
    techLoadingState.classList.remove("hidden");
    techEmptyState.classList.add("hidden");
    techList.innerHTML = "";

    try {
        const data = await getTechnicians(currentStatus);
        const technicians = data.technicians || data.profiles || [];

        if (currentStatus === "pending") {
            pendingBadge.textContent = technicians.length;
            pendingBadge.classList.toggle("hidden", technicians.length === 0);
        }

        if (technicians.length === 0) {
            techEmptyState.classList.remove("hidden");
            return;
        }

        techList.innerHTML = technicians.map(technicianCard).join("");
    } catch (error) {
        techEmptyState.textContent = error.message || "Unable to load technicians.";
        techEmptyState.classList.remove("hidden");
    } finally {
        techLoadingState.classList.add("hidden");
    }
}

techList.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-id]");
    if (!card) return;

    const id = card.dataset.id;
    let decision = null;

    if (event.target.classList.contains("approve-btn")) decision = "approved";
    if (event.target.classList.contains("reject-btn")) decision = "rejected";
    if (!decision) return;

    event.target.disabled = true;
    event.target.textContent = "Saving...";

    try {
        await verifyTechnician(id, decision);
        card.remove();

        if (techList.children.length === 0) {
            techEmptyState.classList.remove("hidden");
        }

        const remainingPending = techList.querySelectorAll("[data-id]").length;
        if (currentStatus === "pending") {
            pendingBadge.textContent = remainingPending;
            pendingBadge.classList.toggle("hidden", remainingPending === 0);
        }
    } catch (error) {
        alert(error.message || "Unable to update technician status.");
        event.target.disabled = false;
        event.target.textContent = decision === "approved" ? "Approve" : "Reject";
    }
});

statusButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        statusButtons.forEach((b) => {
            b.classList.remove("bg-white", "text-slate-900", "shadow-sm");
            b.classList.add("text-slate-500");
        });
        btn.classList.add("bg-white", "text-slate-900", "shadow-sm");
        btn.classList.remove("text-slate-500");

        currentStatus = btn.dataset.status;
        loadTechnicians();
    });
});

loadUsers();
loadTechnicians();
