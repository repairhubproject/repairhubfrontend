// REPAIRHUB ADMIN - SYSTEM SETTINGS
//
// No settings/config backend endpoint exists yet. Every control on this
// page is interactive client-side only (toggles, inputs, key visibility)
// but nothing here is persisted.

import { requireAdmin, renderAdminLayout } from "./components/admin-layout.js";
import { MOCK_PERMISSIONS_MATRIX, MOCK_API_KEYS } from "./api/admin-mock.js";

requireAdmin();

renderAdminLayout({
    active: "settings",
    pageTitle: "System Settings & Configuration",
    pageSubtitle: "Tune platform commission structures, escrow release rules, KYC levels, and access scopes.",
});

// KYC TOGGLES

document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const isOn = btn.getAttribute("aria-pressed") === "true";
        const dot = btn.querySelector(".toggle-dot");

        btn.setAttribute("aria-pressed", String(!isOn));
        btn.classList.toggle("bg-blue-600", !isOn);
        btn.classList.toggle("bg-slate-200", isOn);
        dot.classList.toggle("translate-x-5", !isOn);
        dot.classList.toggle("translate-x-0", isOn);
    });
});

// PERMISSIONS MATRIX (see api/admin-mock.js)

function mark(allowed) {
    return allowed
        ? '<span class="text-emerald-600">✓</span>'
        : '<span class="text-red-500">✕</span>';
}

document.getElementById("permissionsTableBody").innerHTML = MOCK_PERMISSIONS_MATRIX.map(
    (row) => `
    <tr class="border-b last:border-0">
        <td class="py-3">${row.scope}</td>
        <td class="py-3 text-center">${mark(row.superAdmin)}</td>
        <td class="py-3 text-center">${mark(row.operations)}</td>
        <td class="py-3 text-center">${mark(row.support)}</td>
    </tr>`
).join("");

// API KEYS (masked by default, see api/admin-mock.js)

function mask(value) {
    return "•".repeat(Math.min(value.length, 28));
}

document.getElementById("apiKeys").innerHTML = MOCK_API_KEYS.map(
    (key, index) => `
    <div>
        <label class="text-xs font-semibold text-slate-500">${key.label}</label>
        <div class="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <span class="key-value flex-1 truncate font-mono text-xs text-slate-600" data-index="${index}" data-masked="true">
                ${mask(key.value)}
            </span>
            <button class="key-toggle text-slate-400 hover:text-slate-600" data-index="${index}">👁</button>
        </div>
    </div>`
).join("");

document.getElementById("apiKeys").addEventListener("click", (event) => {
    if (!event.target.classList.contains("key-toggle")) return;

    const index = event.target.dataset.index;
    const valueEl = document.querySelector(`.key-value[data-index="${index}"]`);
    const isMasked = valueEl.dataset.masked === "true";

    valueEl.textContent = isMasked ? MOCK_API_KEYS[index].value : mask(MOCK_API_KEYS[index].value);
    valueEl.dataset.masked = String(!isMasked);
});

// STUBBED ACTIONS

function notConnected() {
    alert("System settings are not yet backed by a config endpoint, so changes here aren't persisted.");
}

document.getElementById("saveBtn").addEventListener("click", notConnected);
document.getElementById("discardBtn").addEventListener("click", notConnected);
document.getElementById("rotateKeysBtn").addEventListener("click", notConnected);
