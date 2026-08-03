// REPAIRHUB ADMIN - REPORTS & ANALYTICS
//
// Stat cards + category chart are wired to the real GET /admin/analytics
// endpoint. Regional Performance and Technician Performance Metrics have
// no supporting backend data yet, so they render static sample content
// matching the agreed design.

import Chart from "chart.js/auto";
import { requireAdmin, renderAdminLayout } from "./components/admin-layout.js";
import { getAnalytics } from "./api/admin.js";
import { MOCK_REGIONAL_PERFORMANCE, MOCK_TECHNICIAN_PERFORMANCE } from "./api/admin-mock.js";

requireAdmin();

renderAdminLayout({
    active: "reports",
    pageTitle: "Platform Reports & Analytics",
    pageSubtitle: "Audit user acquisition metrics, technician operational ratings, and regional growth trends.",
});

// TABS

const tabButtons = document.querySelectorAll(".tab-btn");
const panels = {
    acquisition: document.getElementById("panel-acquisition"),
    performance: document.getElementById("panel-performance"),
    growth: document.getElementById("panel-growth"),
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

// STATIC SAMPLE SECTIONS (no backend support yet — see api/admin-mock.js)

document.getElementById("regionalList").innerHTML = MOCK_REGIONAL_PERFORMANCE.map(
    (region) => `
    <div>
        <div class="mb-1 flex items-center justify-between text-xs">
            <span class="font-semibold">${region.name}</span>
            <span class="font-semibold text-blue-600">${region.share}% (${region.value})</span>
        </div>
        <div class="h-1.5 w-full rounded-full bg-slate-100">
            <div class="h-1.5 rounded-full bg-blue-600" style="width: ${region.share}%"></div>
        </div>
    </div>`
).join("");

document.getElementById("performanceTableBody").innerHTML = MOCK_TECHNICIAN_PERFORMANCE.map(
    (row) => `
    <tr class="border-b last:border-0">
        <td class="p-3 font-semibold">${row.name}</td>
        <td class="p-3">${row.active}</td>
        <td class="p-3">${row.time}</td>
        <td class="p-3">${row.rating}</td>
        <td class="p-3 font-semibold ${row.disputeColor}">${row.dispute}</td>
        <td class="p-3">${row.payouts}</td>
        <td class="p-3"><span class="rounded-full px-2 py-1 text-[10px] font-semibold ${row.healthColor}">${row.health}</span></td>
    </tr>`
).join("");

// REAL DATA - GET /admin/analytics

const statCards = document.getElementById("statCards");

function currency(value) {
    if (value == null) return "—";
    return `₦${Number(value).toLocaleString("en-NG")}`;
}

function renderStatCards(data) {
    const counts = data.counts || {};
    const revenue = data.revenue || {};

    const cards = [
        { label: "Total Customers", value: counts.customers ?? "—" },
        { label: "Technicians (Approved / Total)", value: `${counts.technicians_approved ?? 0} / ${counts.technicians_total ?? 0}` },
        { label: "Repair Requests", value: counts.repair_requests ?? "—" },
        { label: "Bookings", value: counts.bookings ?? "—" },
        { label: "Jobs Completed", value: counts.jobs_completed ?? "—" },
        { label: "Gross Revenue", value: currency(revenue.gross) },
        { label: "Platform Commission", value: currency(revenue.platform_commission) },
    ];

    statCards.innerHTML = cards
        .map(
            (card) => `
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">${card.label}</p>
            <h2 class="mt-2 text-xl font-bold">${card.value}</h2>
        </div>`
        )
        .join("");
}

function renderCategoryChart(topCategories) {
    const canvas = document.getElementById("categoryChart");

    if (!topCategories || topCategories.length === 0) {
        canvas.replaceWith(Object.assign(document.createElement("p"), {
            className: "text-sm text-slate-400",
            textContent: "No category data yet.",
        }));
        return;
    }

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: topCategories.map((c) => c.name),
            datasets: [
                {
                    label: "Requests",
                    data: topCategories.map((c) => c.requests),
                    backgroundColor: "#2563eb",
                    borderRadius: 6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
            },
        },
    });
}

async function loadAnalytics() {
    try {
        const data = await getAnalytics();
        renderStatCards(data);
        renderCategoryChart(data.top_categories);
    } catch (error) {
        statCards.innerHTML = `<p class="text-sm text-red-500">${error.message || "Unable to load analytics."}</p>`;
    }
}

loadAnalytics();
