// src/js/components/admin-layout.js
// Shared sidebar + topbar shell for all admin pages, rendered client-side
// to avoid duplicating ~200 lines of markup across every admin page.

const NAV_ITEMS = [
    {
        section: "Operational Core",
        links: [
            { key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect>' },
            { key: "users", label: "Users", href: "users.html", icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' },
            { key: "repairs", label: "Repairs", href: "repairs.html", icon: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-3.1 3.1-3-3z"></path>' },
            { key: "payments", label: "Payments", href: "payments.html", icon: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path>' },
        ],
    },
    {
        section: "Intelligence",
        links: [
            { key: "reports", label: "Reports & Analytics", href: "reports.html", icon: '<path d="M4 19V5"></path><path d="M4 19h16"></path><path d="M8 15l3-4 3 2 5-6"></path>' },
            { key: "settings", label: "System Settings", href: "settings.html", icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.6-1H6.7v-2.4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.1h2.4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1V14h-.1a1.7 1.7 0 0 0-1.6 1z"></path>' },
        ],
    },
];

function navLinkHtml(link, activeKey) {
    const isActive = link.key === activeKey;
    const classes = isActive
        ? "mb-2 flex items-center gap-4 rounded-lg bg-blue-600 px-3 py-3 text-sm font-medium"
        : "mb-2 flex items-center gap-4 rounded-lg px-3 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white";

    return `
        <a href="${link.href}" class="${classes}">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${link.icon}</svg>
            ${link.label}
        </a>`;
}

function initials(name) {
    if (!name) return "AD";
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}

export function renderAdminLayout({ active, pageTitle, pageSubtitle }) {
    const sidebarRoot = document.getElementById("adminSidebarRoot");
    const topbarRoot = document.getElementById("adminTopbarRoot");
    if (!sidebarRoot || !topbarRoot) return;

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const displayName = user?.name || "Admin";

    sidebarRoot.innerHTML = `
        <div id="sidebarOverlay" class="fixed inset-0 z-40 hidden bg-black/40 lg:hidden"></div>

        <aside id="sidebar" class="fixed left-0 top-0 z-50 flex h-screen w-[234px] flex-col bg-[#0f172a] text-white transition-transform duration-300 -translate-x-full lg:translate-x-0">
            <div class="flex h-[86px] items-center border-b border-slate-700 px-6">
                <div class="flex items-center gap-3">
                    <img src="../../src/assets/images/logo.png" alt="RepairHub Logo" class="h-9 w-9 object-contain">
                    <div>
                        <h1 class="text-lg font-bold">RepairHub</h1>
                        <p class="text-[10px] tracking-[2px] text-slate-400">ADMIN COMMAND</p>
                    </div>
                </div>
            </div>

            <nav class="flex-1 px-4 py-7">
                ${NAV_ITEMS.map((group, i) => `
                    <p class="mb-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 ${i > 0 ? "mt-6" : ""}">
                        ${group.section}
                    </p>
                    ${group.links.map((link) => navLinkHtml(link, active)).join("")}
                `).join("")}
            </nav>

            <div class="border-t border-slate-700 p-5">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-500 text-sm font-bold">
                        ${initials(displayName)}
                    </div>
                    <div>
                        <p class="text-sm font-semibold">${displayName}</p>
                        <p class="text-xs text-emerald-400">● Admin</p>
                    </div>
                </div>
            </div>
        </aside>`;

    topbarRoot.innerHTML = `
        <header class="flex h-[62px] items-center justify-between border-b border-gray-200 bg-white px-5 sm:px-8">
            <button id="menuButton" class="mr-4 rounded-lg p-2 text-gray-600 lg:hidden">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>

            <div class="relative hidden w-full max-w-[375px] sm:block">
                <svg class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7"></circle>
                    <path d="m20 20-4-4"></path>
                </svg>
                <input type="text" placeholder="Search for a service, technician, or customer..." class="h-9 w-full rounded-lg border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-blue-500">
            </div>

            <div class="ml-auto flex items-center gap-4">
                <button class="relative">
                    <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
                        <path d="M10 21h4"></path>
                    </svg>
                </button>

                <div class="hidden border-l border-gray-200 pl-4 sm:block">
                    <p class="text-xs font-bold">${displayName.toUpperCase()}</p>
                    <p class="text-[10px] text-gray-400">${user?.email || ""}</p>
                </div>

                <button id="adminLogoutBtn" class="text-xs font-semibold text-slate-400 hover:text-red-500">
                    Logout
                </button>
            </div>
        </header>

        <div class="p-5 sm:p-8 pb-0">
            <div class="mb-6">
                <h1 class="text-2xl font-bold sm:text-3xl">${pageTitle}</h1>
                <p class="mt-1 text-sm text-slate-500">${pageSubtitle}</p>
            </div>
        </div>`;

    const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    menuButton.addEventListener("click", () => {
        sidebar.classList.remove("-translate-x-full");
        sidebarOverlay.classList.remove("hidden");
    });

    sidebarOverlay.addEventListener("click", () => {
        sidebar.classList.add("-translate-x-full");
        sidebarOverlay.classList.add("hidden");
    });

    document.getElementById("adminLogoutBtn").addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/pages/auth/login.html";
    });
}

export function requireAdmin() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || user?.role !== "admin") {
        window.location.href = "/pages/auth/login.html";
        return null;
    }

    return user;
}
