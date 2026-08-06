import { html, toHTML } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import api from '../api/client.js';
import { naira, formatDateTime, timeAgo } from '../lib/format.js';
import { Spinner, StatusBadge, EmptyState, Avatar, RatingStars } from '../components/ui.js';
import { getAuth } from '../state/auth.js';

const TONES = {
  brand: 'bg-brand-surface text-brand-500',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
};

function StatCard({ icon: name, label, value, to, tone = 'brand' }) {
  const body = html`
    <div class="card flex items-center gap-4 p-4 transition hover:shadow-md sm:p-5">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}"
        >${icon(name, 'h-5 w-5')}</span
      >
      <div class="min-w-0">
        <p class="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">${value}</p>
        <p class="text-sm text-slate-500">${label}</p>
      </div>
    </div>
  `;
  return to ? html`<a href="${to}">${body}</a>` : body;
}

/** Headline metric card from the admin "Command Center" frame (1427:1633). */
function BigStat({ icon: name, label, value, hint, to, tone = 'brand' }) {
  const body = html`
    <div class="card h-full p-5 transition hover:shadow-md">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs text-slate-500">${label}</p>
          <p class="mt-1.5 break-words text-2xl font-extrabold text-slate-900">${value}</p>
        </div>
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}"
          >${icon(name, 'h-5 w-5')}</span
        >
      </div>
      ${hint && html`<p class="mt-2 text-xs text-slate-400">${hint}</p>`}
    </div>
  `;
  return to ? html`<a href="${to}">${body}</a>` : body;
}

/* ------------------------------- Customer -------------------------------- */

function customerDashboard(root, user, alive) {
  root.innerHTML = toHTML(Spinner());

  Promise.all([
    api.get('/requests/mine').catch(() => ({ data: { requests: [] } })),
    api.get('/bookings/mine').catch(() => ({ data: { bookings: [] } })),
    api.get('/warranties/mine').catch(() => ({ data: { warranties: [] } })),
  ]).then(([r, b, w]) => {
    if (!alive()) return;
    paint({
      requests: r.data.requests || [],
      bookings: b.data.bookings || [],
      warranties: w.data.warranties || [],
    });
  });

  function paint(data) {
    const active = data.bookings.filter((b) => ['scheduled', 'in_progress'].includes(b.status));
    const openRequests = data.requests.filter((r) => r.status === 'open');

    root.innerHTML = toHTML(html`
      <div>
        <!-- Greeting -->
        <div class="mb-8 flex items-center gap-4">
          ${Avatar({ name: user.name, className: 'h-14 w-14 text-lg' })}
          <div>
            <h1 class="text-2xl font-extrabold leading-tight text-slate-900">
              Hi ${user.name.split(' ')[0]}!
            </h1>
            <p class="text-slate-500">what do you want to fix</p>
          </div>
        </div>

        <!-- Categories -->
        <section class="mb-8">
          <div class="mb-5 flex items-end justify-between gap-3">
            <h2 class="text-2xl font-extrabold text-slate-900">Categories</h2>
            <a
              href="/categories"
              class="inline-flex items-center gap-1 text-lg font-semibold text-brand-500 hover:underline"
              >See all ${icon('ChevronRight', 'h-5 w-5')}</a
            >
          </div>
          <div data-categories>
            <p class="text-sm text-slate-500">Categories are loading…</p>
          </div>
        </section>

        <!-- Promo banner -->
        <a
          href="/requests/new"
          class="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#3264C4] to-[#1F3A7A] px-7 py-6 text-white transition hover:brightness-110"
        >
          <div>
            <p class="text-2xl font-extrabold">Need urgent help?</p>
            <p class="font-semibold text-white/90">Emergency repairs available 24/7</p>
          </div>
          <span class="btn bg-white font-semibold text-brand-500 hover:bg-brand-surface focus:ring-white"
            >Post a request</span
          >
        </a>

        <!-- Nearby technicians -->
        <section class="mb-8">
          <div class="mb-5 flex items-end justify-between gap-3">
            <h2 class="text-2xl font-extrabold text-slate-900">Nearby Technicians</h2>
            <a
              href="/technicians"
              class="inline-flex items-center gap-1 text-lg font-semibold text-brand-500 hover:underline"
              >See all ${icon('ChevronRight', 'h-5 w-5')}</a
            >
          </div>
          <div data-techs></div>
        </section>

        <!-- At-a-glance counts -->
        <div class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          ${StatCard({ icon: 'ClipboardList', label: 'Open requests', value: openRequests.length, to: '/requests' })}
          ${StatCard({ icon: 'CalendarCheck', label: 'Active repairs', value: active.length, to: '/bookings', tone: 'amber' })}
          ${StatCard({
            icon: 'CheckCircle2',
            label: 'Completed repairs',
            value: data.bookings.filter((b) => b.status === 'completed').length,
            to: '/bookings',
            tone: 'emerald',
          })}
          ${StatCard({ icon: 'ShieldCheck', label: 'Warranties', value: data.warranties.length, to: '/warranties', tone: 'violet' })}
        </div>

        <div class="mt-8 grid gap-6 xl:grid-cols-2">
          <section>
            <h2 class="mb-3 font-semibold text-slate-900">Recent requests</h2>
            ${data.requests.length === 0
              ? EmptyState({
                  title: 'No repair requests yet',
                  hint: "Describe what's broken and get quotes from verified technicians near you.",
                  action: html`<a href="/requests/new" class="btn-primary mt-2"
                    >Create your first request</a
                  >`,
                })
              : html`
                  <div class="card divide-y divide-slate-100">
                    ${data.requests.slice(0, 5).map(
                      (r) => html`
                        <a
                          href="/requests/${r.id}"
                          class="flex items-center justify-between gap-3 p-4 hover:bg-slate-50"
                        >
                          <div class="min-w-0">
                            <p class="truncate font-medium text-slate-900">${r.title}</p>
                            <p class="text-xs text-slate-500">
                              ${r.category_name} · ${timeAgo(r.created_at)}
                            </p>
                          </div>
                          ${StatusBadge(r.status)}
                        </a>
                      `
                    )}
                  </div>
                `}
          </section>

          <section>
            <h2 class="mb-3 font-semibold text-slate-900">Active bookings</h2>
            ${active.length === 0
              ? EmptyState({
                  title: 'No active bookings',
                  hint: 'Accept a quotation on one of your requests to book a repair.',
                })
              : html`
                  <div class="card divide-y divide-slate-100">
                    ${active.map(
                      (b) => html`
                        <a
                          href="/bookings/${b.id}"
                          class="flex items-center justify-between gap-3 p-4 hover:bg-slate-50"
                        >
                          <div class="min-w-0">
                            <p class="truncate font-medium text-slate-900">${b.title}</p>
                            <p class="text-xs text-slate-500">
                              ${b.technician_name} · ${naira(b.quoted_amount)}${b.scheduled_at
                                ? ` · ${formatDateTime(b.scheduled_at)}`
                                : ''}
                            </p>
                          </div>
                          ${StatusBadge(b.status)}
                        </a>
                      `
                    )}
                  </div>
                `}
          </section>
        </div>
      </div>
    `);

    const categoriesEl = root.querySelector('[data-categories]');
    const techsEl = root.querySelector('[data-techs]');

    api
      .get('/categories')
      .then(({ data: c }) => {
        if (!alive()) return;
        const categories = c.categories.slice(0, 5);
        if (categories.length === 0) return;
        categoriesEl.innerHTML = toHTML(html`
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            ${categories.map(
              (c2) => html`
                <a href="/technicians?category=${c2.slug}" class="group text-center">
                  <span
                    class="mx-auto flex h-[90px] w-[90px] items-center justify-center rounded-2xl border-2 border-brand-500 bg-brand-surface text-brand-500 transition group-hover:bg-brand-pill"
                    >${icon('Wrench', 'h-8 w-8')}</span
                  >
                  <p class="mt-2 font-bold leading-tight text-slate-900">${c2.name}</p>
                </a>
              `
            )}
          </div>
        `);
      })
      .catch(() => {});

    // No coords sent — the API falls back to IP location for "nearby".
    api
      .get('/technicians')
      .then(({ data: t }) => {
        if (!alive()) return;
        const techs = t.technicians.slice(0, 3);
        techsEl.innerHTML = toHTML(
          techs.length === 0
            ? EmptyState({
                title: 'No technicians nearby yet',
                hint: 'New technicians are verified daily — check back soon.',
              })
            : html`
                <div class="space-y-4">
                  ${techs.map(
                    (tech) => html`
                      <div class="card-raised flex flex-wrap items-center gap-4 p-5">
                        ${Avatar({ name: tech.name, className: 'h-16 w-16 text-lg' })}
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-xl font-extrabold text-slate-900">${tech.name}</p>
                          <p class="truncate text-slate-600">
                            ${tech.categories?.[0]?.name || 'Repair'} Specialist
                          </p>
                          <div
                            class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500"
                          >
                            ${RatingStars({ value: tech.rating_avg, count: tech.rating_count })}
                            <span class="flex items-center gap-1">
                              ${icon('MapPin', 'h-3.5 w-3.5')}
                              ${tech.distance_km != null
                                ? `${Number(tech.distance_km).toFixed(1)} km away`
                                : tech.address || 'Nigeria'}
                            </span>
                          </div>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                          ${tech.is_available &&
                          html`<span
                            class="rounded-full bg-brand-chip px-3 py-1 text-xs font-medium text-brand-500"
                            >Available</span
                          >`}
                          <a
                            href="/technicians/${tech.id}"
                            class="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:underline"
                            >See Profile ${icon('ChevronRight', 'h-4 w-4')}</a
                          >
                        </div>
                      </div>
                    `
                  )}
                </div>
              `
        );
      })
      .catch(() => {});
  }
}

/* ------------------------------ Technician -------------------------------- */

function technicianDashboard(root, user, alive) {
  root.innerHTML = toHTML(Spinner());

  const state = { profile: undefined, jobs: [], available: null, wallet: null };

  Promise.all([
    api.get('/technicians/me').then(({ data }) => (state.profile = data.profile)).catch(() => (state.profile = null)),
    api.get('/bookings/mine').then(({ data }) => (state.jobs = data.bookings)).catch(() => {}),
    api.get('/wallet').then(({ data }) => (state.wallet = data)).catch(() => {}),
    api
      .get('/requests/available')
      .then(({ data }) => (state.available = data.requests.length))
      .catch(() => (state.available = null)),
  ]).then(() => {
    if (alive()) paint();
  });

  function paint() {
    const { profile, jobs, available, wallet } = state;

    if (profile === null) {
      root.innerHTML = toHTML(
        EmptyState({
          iconName: 'Wrench',
          title: 'Set up your service profile',
          hint: "Tell customers what you repair, where you work, and upload your ID for verification. You'll start receiving repair requests once an admin approves you.",
          action: html`<a href="/tech/profile" class="btn-primary mt-2">Create service profile</a>`,
        })
      );
      return;
    }

    const activeJobs = jobs.filter((b) => ['scheduled', 'in_progress'].includes(b.status));

    const quickActions = [
      { to: '/tech/requests', label: 'New Jobs', icon: 'ClipboardList' },
      { to: '/bookings', label: `Active Jobs (${activeJobs.length})`, icon: 'CalendarCheck' },
      { to: '/wallet', label: 'Wallet', icon: 'Wallet' },
      { to: '/tech/profile', label: 'Profile', icon: 'Wrench' },
    ];

    root.innerHTML = toHTML(html`
      <div>
        <!-- Greeting -->
        <div class="mb-6 flex items-center gap-4">
          ${Avatar({ name: user.name, className: 'h-14 w-14 text-lg' })}
          <div>
            <h1 class="text-2xl font-extrabold leading-tight text-slate-900">Hello, ${user.name}</h1>
            <p class="text-slate-500">Here is your overview</p>
          </div>
        </div>

        ${profile.verification_status === 'pending' &&
        html`
          <div
            class="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            ${icon('Clock', 'mt-0.5 h-5 w-5 shrink-0')}
            <div>
              <p class="font-semibold">Verification pending</p>
              <p>
                An admin is reviewing your profile. You&apos;ll be able to see and quote repair
                requests once approved.
              </p>
            </div>
          </div>
        `}
        ${profile.verification_status === 'rejected' &&
        html`
          <div
            class="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            ${icon('AlertTriangle', 'mt-0.5 h-5 w-5 shrink-0')}
            <div>
              <p class="font-semibold">Verification rejected</p>
              <p>
                Update your profile details and ID document, then contact support.
                <a href="/tech/profile" class="font-medium underline">Edit profile</a>
              </p>
            </div>
          </div>
        `}

        <!-- Wallet balance -->
        <div
          class="mb-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-gradient-to-r from-[#3264C4] to-[#1F3A7A] px-7 py-6 text-white"
        >
          <div>
            <p class="text-sm text-white/80">Wallet Balance</p>
            <p class="mt-1 flex flex-wrap items-baseline gap-3">
              <span class="text-3xl font-extrabold sm:text-4xl"
                >${wallet ? naira(wallet.balance) : '—'}</span
              >
              <span class="text-sm text-white/80">Available Balance</span>
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <a
              href="/wallet"
              class="btn bg-slate-900 font-semibold text-white hover:bg-slate-800 focus:ring-white"
              >Withdraw Funds</a
            >
            <a
              href="/wallet"
              class="btn bg-white font-semibold text-slate-900 hover:bg-slate-100 focus:ring-white"
              >View Transactions</a
            >
          </div>
        </div>

        <!-- Statistics -->
        <section class="mb-10">
          <h2 class="mb-5 text-2xl font-extrabold text-slate-900">Statistics</h2>
          <div class="grid gap-5 sm:grid-cols-3">
            ${StatCard({ icon: 'ClipboardList', label: 'New Jobs', value: available ?? '—', to: '/tech/requests' })}
            ${StatCard({ icon: 'CalendarCheck', label: 'Active Jobs', value: activeJobs.length, to: '/bookings', tone: 'amber' })}
            ${StatCard({
              icon: 'CheckCircle2',
              label: 'Completed',
              value: jobs.filter((b) => b.status === 'completed').length,
              to: '/bookings',
              tone: 'emerald',
            })}
          </div>
        </section>

        <!-- Quick actions -->
        <section class="mb-10">
          <h2 class="mb-5 text-center text-2xl font-extrabold text-slate-900">Quick Action</h2>
          <div class="grid grid-cols-2 gap-5 sm:grid-cols-4">
            ${quickActions.map(
              (a) => html`
                <a
                  href="${a.to}"
                  class="flex flex-col items-center gap-2 rounded-xl p-4 text-center transition hover:bg-brand-surface"
                >
                  ${icon(a.icon, 'h-7 w-7 text-slate-700')}
                  <span class="text-sm font-bold text-slate-900">${a.label}</span>
                </a>
              `
            )}
          </div>
        </section>

        <!-- Recent activities -->
        <section>
          <h2 class="mb-5 text-2xl font-extrabold text-slate-900">Recent Activities</h2>
          ${jobs.length === 0
            ? EmptyState({
                title: 'No jobs yet',
                hint: 'Browse available repair requests in your area and submit quotations to win jobs.',
                action: html`<a href="/tech/requests" class="btn-primary mt-2"
                  >Browse available requests</a
                >`,
              })
            : html`
                <div class="space-y-3">
                  ${jobs.slice(0, 6).map(
                    (b) => html`
                      <a
                        href="/bookings/${b.id}"
                        class="card-raised flex flex-wrap items-center gap-4 p-4 transition hover:shadow-md"
                      >
                        <span
                          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-500"
                          >${icon('Wrench', 'h-5 w-5')}</span
                        >
                        <div class="min-w-0 flex-1">
                          <p class="truncate font-bold text-slate-900">${b.title}</p>
                          <p class="truncate text-sm text-slate-600">${b.category_name}</p>
                          <p class="mt-0.5 text-xs text-slate-500">
                            ${b.customer_name}${b.scheduled_at
                              ? ` · ${formatDateTime(b.scheduled_at)}`
                              : ''}
                          </p>
                        </div>
                        <div class="flex items-center gap-4">
                          <span class="font-bold text-slate-900">${naira(b.quoted_amount)}</span>
                          ${StatusBadge(b.status)}
                        </div>
                      </a>
                    `
                  )}
                </div>
              `}
        </section>
      </div>
    `);
  }
}

/* --------------------------------- Admin ---------------------------------- */

function adminDashboard(root, alive) {
  root.innerHTML = toHTML(Spinner());

  api
    .get('/admin/analytics')
    .then(({ data }) => {
      if (alive()) paint(data);
    })
    .catch(() => {});

  function paint(data) {
    // GET /admin/analytics reports totals only — no per-month series — so the
    // board's revenue trend chart has no data to draw and is left out.
    const inProgress = Math.max(0, data.counts.bookings - data.counts.jobs_completed);
    const topCount = data.top_categories[0]?.requests || 1;

    root.innerHTML = toHTML(html`
      <div>
        <div class="mb-8">
          <h1 class="text-2xl font-extrabold text-slate-900">Admin Command Center</h1>
          <p class="mt-1 text-sm text-slate-500">
            Real-time overview of the RepairHub marketplace.
          </p>
        </div>

        <div class="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          ${BigStat({
            label: 'Total Gross Volume',
            value: naira(data.revenue.gross),
            hint: 'All completed payments',
            icon: 'TrendingUp',
            tone: 'brand',
          })}
          ${BigStat({
            label: 'Active Service Providers',
            value: data.counts.technicians_approved,
            hint: `${data.counts.technicians_total} total registered`,
            icon: 'Wrench',
            tone: 'emerald',
            to: '/admin/technicians',
          })}
          ${BigStat({
            label: 'Repairs in Progress',
            value: inProgress,
            hint: `${data.counts.bookings} bookings all-time`,
            icon: 'ClipboardList',
            tone: 'amber',
          })}
          ${BigStat({
            label: 'Platform Commission',
            value: naira(data.revenue.platform_commission),
            hint: 'Earned on completed repairs',
            icon: 'Banknote',
            tone: 'violet',
          })}
        </div>

        <div class="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          ${StatCard({ icon: 'Users', label: 'Customers', value: data.counts.customers, to: '/admin/users' })}
          ${StatCard({ icon: 'ClipboardList', label: 'Repair requests', value: data.counts.repair_requests, tone: 'amber' })}
          ${StatCard({ icon: 'CalendarCheck', label: 'Bookings', value: data.counts.bookings, tone: 'amber' })}
          ${StatCard({ icon: 'CheckCircle2', label: 'Jobs completed', value: data.counts.jobs_completed, tone: 'emerald' })}
        </div>

        <section class="max-w-2xl">
          <h2 class="mb-3 font-semibold text-slate-900">Top repair categories</h2>
          ${data.top_categories.length === 0
            ? EmptyState({ title: 'No requests yet' })
            : html`
                <div class="card divide-y divide-slate-100">
                  ${data.top_categories.map(
                    (c) => html`
                      <div class="p-4">
                        <div class="flex items-center justify-between gap-4">
                          <span class="font-medium text-slate-800">${c.name}</span>
                          <span class="shrink-0 text-sm text-slate-500"
                            >${c.requests} request${c.requests === 1 ? '' : 's'}</span
                          >
                        </div>
                        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            class="h-full rounded-full bg-brand-500"
                            style="width: ${(c.requests / topCount) * 100}%"
                          ></div>
                        </div>
                      </div>
                    `
                  )}
                </div>
              `}
        </section>
      </div>
    `);
  }
}

export default function Dashboard(root) {
  const { user } = getAuth();
  let live = true;
  const alive = () => live;

  if (user.role === 'technician') technicianDashboard(root, user, alive);
  else if (user.role === 'admin') adminDashboard(root, alive);
  else customerDashboard(root, user, alive);

  return () => {
    live = false;
  };
}
