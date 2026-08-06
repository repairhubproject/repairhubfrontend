/**
 * App chrome — the Layout.jsx replacement.
 *
 * Each shell mounts once and returns the outlet element pages render into, so
 * navigating within the app never rebuilds the sidebar. `onNavigate` runs on
 * every route change to refresh the bits that depend on the URL (active nav
 * link, mobile drawer state).
 *
 * Sidebar groups mirror the Figma desktop board (MAIN / ACCOUNT / SYSTEM).
 * Only destinations the API can actually serve are listed — see README for the
 * designed entries (Message, Reviews, Saved Addresses, Payment Methods,
 * Settings) that have no backend endpoint yet.
 */
import { html, toHTML, cls, on } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { Avatar } from './ui.js';
import { logout } from '../state/auth.js';
import { navigate, refresh as refreshRouter } from '../lib/router.js';
import { subscribeNotifications, unreadCount } from '../state/notifications.js';

const NAV_BY_ROLE = {
  customer: [
    {
      section: 'Main',
      links: [
        { to: '/dashboard', label: 'Dashboard', icon: 'Home' },
        { to: '/search', label: 'Search', icon: 'Search' },
        { to: '/requests', label: 'Repairs', icon: 'ClipboardList' },
        { to: '/bookings', label: 'Bookings', icon: 'CalendarCheck' },
        { to: '/categories', label: 'Categories', icon: 'LayoutGrid' },
      ],
    },
    {
      section: 'Account',
      links: [
        { to: '/notifications', label: 'Notification', icon: 'Bell' },
        { to: '/warranties', label: 'Warranties', icon: 'ShieldCheck' },
        { to: '/profile', label: 'Profile', icon: 'User' },
      ],
    },
  ],
  technician: [
    {
      section: 'Main',
      links: [
        { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
        { to: '/tech/requests', label: 'Requests', icon: 'LayoutGrid' },
        { to: '/bookings', label: 'Jobs', icon: 'CalendarCheck' },
        { to: '/wallet', label: 'Earnings', icon: 'Wallet' },
      ],
    },
    {
      section: 'Account',
      links: [
        { to: '/profile', label: 'Profile', icon: 'User' },
        { to: '/notifications', label: 'Notification', icon: 'Bell' },
        { to: '/tech/profile', label: 'Business Details', icon: 'UserCog' },
      ],
    },
  ],
  admin: [
    {
      section: 'Operational core',
      links: [
        { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
        { to: '/admin/users', label: 'Users', icon: 'Users' },
        { to: '/admin/technicians', label: 'Verification', icon: 'BadgeCheck' },
        { to: '/admin/categories', label: 'Categories', icon: 'LayoutGrid' },
      ],
    },
    {
      section: 'Intelligence',
      links: [
        { to: '/notifications', label: 'Notification', icon: 'Bell' },
        { to: '/profile', label: 'Profile', icon: 'User' },
      ],
    },
  ],
};

export function Logo(className = 'h-10 w-10') {
  return html`
    <span class="flex items-center gap-2.5">
      <!-- logo-mark.png is the icon alone. The full logo-4.png lockup has
           "REPAIR HUB" baked into the artwork, which would double up with the
           wordmark beside it — the board pairs the mark with live text. -->
      <img src="/logo-mark.png" alt="" class="${className} object-contain" />
      <!-- Colour is inherited so the same mark works on the light customer
           sidebar and the dark admin shell. -->
      <span class="text-lg font-bold">RepairHub</span>
    </span>
  `;
}

/* --------------------------- Public / guest shell -------------------------- */

export function mountGuestShell(root) {
  root.innerHTML = toHTML(html`
    <div class="flex min-h-screen flex-col">
      <header class="sticky top-0 z-40 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
        <div class="mx-auto flex w-[95%] max-w-6xl items-center justify-between gap-7 py-3">
          <a href="/">${Logo('h-9 w-9 lg:h-14 lg:w-14')}</a>

          <a
            href="/technicians"
            class="hidden rounded-lg px-5 py-2 font-medium text-slate-800 transition-colors hover:bg-slate-100 md:block"
            >Find a technician</a
          >

          <div class="hidden items-center gap-3 md:flex">
            <a href="/login" class="btn-outline">Login</a>
            <a href="/register" class="btn-primary">Sign up</a>
          </div>

          <button
            type="button"
            data-menu-toggle
            class="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Menu"
          >
            ${icon('Menu', 'h-5 w-5')}
          </button>
        </div>

        <nav data-mobile-nav hidden class="border-t border-slate-200 bg-white px-5 py-4 md:hidden">
          <a
            href="/technicians"
            class="block rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
            >Find a technician</a
          >
          <div class="mt-3 flex gap-2">
            <a href="/login" class="btn-outline flex-1">Login</a>
            <a href="/register" class="btn-primary flex-1">Sign up</a>
          </div>
        </nav>
      </header>

      <main data-outlet class="flex-1"></main>

      <footer class="border-t border-slate-200 bg-white py-6">
        <div class="mx-auto w-[95%] max-w-6xl text-center text-sm text-slate-500">
          RepairHub — Trusted Repair Services Marketplace · TechCrush Capstone, Group 9
        </div>
      </footer>
    </div>
  `);

  const toggle = root.querySelector('[data-menu-toggle]');
  const nav = root.querySelector('[data-mobile-nav]');

  toggle.addEventListener('click', () => {
    nav.hidden = !nav.hidden;
    toggle.innerHTML = toHTML(icon(nav.hidden ? 'Menu' : 'X', 'h-5 w-5'));
  });
  // Any navigation closes the drawer — otherwise it covers the new page.
  on(nav, 'click', 'a', () => {
    nav.hidden = true;
    toggle.innerHTML = toHTML(icon('Menu', 'h-5 w-5'));
  });

  return root.querySelector('[data-outlet]');
}

/* ------------------------- Authenticated app shell ------------------------- */

export function mountAppShell(root, user) {
  const groups = NAV_BY_ROLE[user.role] || NAV_BY_ROLE.customer;
  // The admin console is a dark shell on the board; customer/technician are light.
  const isAdmin = user.role === 'admin';

  const navSections = groups.map(
    ({ section, links }) => html`
      <div class="mb-5">
        <p class="mb-2 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          ${section}
        </p>
        <div class="flex flex-col gap-1">
          ${links.map(
            (link) => html`
              <a href="${link.to}" data-nav="${link.to}" class="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition">
                ${icon(link.icon, 'h-[18px] w-[18px] shrink-0')}
                <span class="truncate">${link.label}</span>
              </a>
            `
          )}
        </div>
      </div>
    `
  );

  root.innerHTML = toHTML(html`
    <div class="min-h-screen bg-white">
      <!-- Sidebar — permanent from lg, drawer below it -->
      <aside
        data-sidebar
        class="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto transition-transform duration-300 hide-scrollbar lg:translate-x-0 -translate-x-full ${isAdmin
          ? 'bg-ink-900 text-white'
          : 'bg-brand-sidebar'}"
      >
        <a href="/dashboard" class="flex shrink-0 flex-col px-6 py-6">
          ${Logo('h-12 w-12')}
          ${isAdmin &&
          html`<span
            class="mt-1 pl-[58px] text-[10px] font-semibold uppercase tracking-widest text-slate-500"
            >Admin Command</span
          >`}
        </a>

        <nav aria-label="Main navigation" class="flex-1 px-4 pb-4">
          ${navSections}
          <div class="mb-5">
            <p class="mb-2 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              System
            </p>
            <button
              type="button"
              data-logout
              class="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm transition ${isAdmin
                ? 'text-slate-400 hover:bg-ink-800 hover:text-white'
                : 'text-slate-500 hover:bg-brand-pill/40 hover:text-brand-500'}"
            >
              ${icon('LogOut', 'h-[18px] w-[18px] shrink-0')}
              Logout
            </button>
          </div>
        </nav>
      </aside>

      <div data-scrim hidden class="fixed inset-0 z-40 bg-black/40 lg:hidden"></div>

      <!-- Content column -->
      <div class="lg:pl-[280px]">
        <!-- Floating top bar card -->
        <header class="sticky top-0 z-30 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <button
              type="button"
              data-sidebar-toggle
              class="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle navigation"
            >
              ${icon('Menu', 'h-5 w-5')}
            </button>

            <form data-search class="min-w-0 flex-1">
              <div
                class="flex h-11 items-center gap-2 rounded-full border border-slate-300 px-4 focus-within:border-brand-500"
              >
                <input
                  type="search"
                  name="q"
                  placeholder="Search for a service"
                  class="h-full w-full min-w-0 bg-transparent text-sm outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  class="shrink-0 text-slate-500 hover:text-brand-500"
                >
                  ${icon('Search', 'h-5 w-5')}
                </button>
              </div>
            </form>

            <a
              href="/notifications"
              class="hidden shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 sm:block"
              aria-label="Messages"
            >
              ${icon('Mail', 'h-5 w-5')}
            </a>

            <a
              href="/notifications"
              class="relative shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              ${icon('Bell', 'h-5 w-5')}
              <span data-unread hidden
                class="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
              ></span>
            </a>

            <span class="hidden shrink-0 items-center gap-1.5 text-sm text-slate-500 xl:flex">
              ${icon('CircleHelp', 'h-5 w-5 text-brand-500')} Help
            </span>

            <a href="/profile" class="flex shrink-0 items-center gap-2.5">
              ${Avatar({ name: user.name, className: 'h-9 w-9 text-xs' })}
              <span class="hidden text-sm text-slate-800 sm:block">${user.name}</span>
            </a>
          </div>
        </header>

        <main data-outlet class="px-4 pb-12 sm:px-6"></main>
      </div>
    </div>
  `);

  const sidebar = root.querySelector('[data-sidebar]');
  const scrim = root.querySelector('[data-scrim]');
  const badge = root.querySelector('[data-unread]');

  function setSidebar(open) {
    sidebar.classList.toggle('translate-x-0', open);
    sidebar.classList.toggle('-translate-x-full', !open);
    scrim.hidden = !open;
  }

  root.querySelector('[data-sidebar-toggle]').addEventListener('click', () => {
    setSidebar(sidebar.classList.contains('-translate-x-full'));
  });
  scrim.addEventListener('click', () => setSidebar(false));

  root.querySelector('[data-logout]').addEventListener('click', () => {
    logout();
    navigate('/');
    refreshRouter();
  });

  root.querySelector('[data-search]').addEventListener('submit', (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('q') || '';
    navigate(`/technicians?q=${encodeURIComponent(term.trim())}`);
  });

  function paintUnread() {
    const n = unreadCount();
    badge.hidden = n === 0;
    badge.textContent = n > 9 ? '9+' : String(n);
  }
  // The shell outlives every page, but not a logout — the router calls
  // destroy() below when it swaps back to the guest shell.
  const stopWatching = subscribeNotifications(paintUnread, { immediate: true });

  const activeCls = isAdmin ? ['bg-brand-500', 'font-medium', 'text-white'] : ['bg-brand-pill', 'font-medium', 'text-brand-500'];
  const idleCls = isAdmin
    ? ['text-slate-400', 'hover:bg-ink-800', 'hover:text-white']
    : ['text-slate-500', 'hover:bg-brand-pill/40', 'hover:text-brand-500'];

  function paintNav(path) {
    for (const link of root.querySelectorAll('[data-nav]')) {
      const to = link.dataset.nav;
      // `/dashboard` matched exactly in the old NavLink (end); the rest by prefix.
      const active = to === '/dashboard' ? path === to : path === to || path.startsWith(`${to}/`);
      link.classList.remove(...activeCls, ...idleCls);
      link.classList.add(...(active ? activeCls : idleCls));
    }
  }

  return {
    outlet: root.querySelector('[data-outlet]'),
    onNavigate(ctx) {
      setSidebar(false);
      paintNav(ctx.path);
    },
    destroy: stopWatching,
  };
}

export { NAV_BY_ROLE };
