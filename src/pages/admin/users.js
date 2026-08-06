import { html, toHTML, on } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api from '../../api/client.js';
import { formatDate } from '../../lib/format.js';
import { Spinner, EmptyState, Avatar } from '../../components/ui.js';

const TABS = [
  { key: 'all', label: 'All Users' },
  { key: 'customer', label: 'Customers' },
  { key: 'technician', label: 'Technicians' },
  { key: 'admin', label: 'Admins' },
];

const ROLE_BADGE = {
  customer: 'bg-brand-surface text-brand-500',
  technician: 'bg-amber-50 text-amber-700',
  admin: 'bg-violet-50 text-violet-700',
};

/** Technician verification maps onto the board's account-status chips. */
const STATUS_CHIP = {
  approved: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  pending: { label: 'Pending KYC', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  rejected: { label: 'Suspended', cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

const PAGE_SIZE = 10;

/** Display id in the board's format — derived from the real primary key. */
function displayId(user) {
  const prefix = { customer: 'USR', technician: 'TEC', admin: 'ADM' }[user.role] || 'USR';
  return `RH-${prefix}-${String(user.id).padStart(4, '0')}`;
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function Users(root) {
  let users = null;
  // Technician profiles carry address + verification status, which the plain
  // user record does not — keyed by user_id to enrich the directory rows.
  let techByUser = {};
  let q = '';
  let tab = 'all';
  let status = 'all';
  let page = 1;
  let cancelled = false;

  root.innerHTML = toHTML(Spinner());

  api
    .get('/admin/users')
    .then(({ data }) => (users = data.users))
    .catch(() => (users = []))
    .finally(() => {
      if (!cancelled) mount();
    });

  // The verification queue is per-status, so pull all three and merge.
  Promise.all(
    ['approved', 'pending', 'rejected'].map((s) =>
      api
        .get('/admin/technicians', { params: { status: s } })
        .then(({ data }) => data.technicians || data.profiles || [])
        .catch(() => [])
    )
  ).then((lists) => {
    if (cancelled) return;
    const map = {};
    for (const t of lists.flat()) if (t.user_id) map[t.user_id] = t;
    techByUser = map;
    if (users) paintTable();
  });

  function visible() {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (tab !== 'all' && u.role !== tab) return false;
      if (status !== 'all' && techByUser[u.id]?.verification_status !== status) return false;
      if (!term) return true;
      return [u.name, u.email, u.phone, displayId(u)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }

  function exportCsv() {
    const header = ['User ID', 'Name', 'Email', 'Role', 'Location', 'Phone', 'Registered', 'Status'];
    const body = visible().map((u) => {
      const t = techByUser[u.id];
      return [
        displayId(u),
        u.name,
        u.email,
        u.role,
        t?.address || '',
        u.phone || '',
        formatDate(u.created_at),
        t ? STATUS_CHIP[t.verification_status]?.label || t.verification_status : '',
      ].map(csvCell);
    });
    const csv = [header.map(csvCell), ...body].map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `repairhub-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* The filter bar is painted once so the search field keeps focus; only the
     tab strip and the table below it are repainted. */
  function mount() {
    root.innerHTML = toHTML(html`
      <div>
        <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Directory &amp; Entity Management</h1>
            <p class="mt-1 text-sm text-slate-500">
              Manage and audit customers, technicians and administrators.
            </p>
          </div>
          <div data-tabs class="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1"></div>
        </div>

        <!-- Filter bar -->
        <div class="card mb-5 flex flex-wrap items-center gap-3 p-4">
          <div class="relative min-w-56 flex-1">
            ${icon('Search', 'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400')}
            <input data-q class="input pl-9" placeholder="Filter by name or email…" />
          </div>
          <select data-status class="input w-auto min-w-44">
            <option value="all">All Statuses</option>
            <option value="approved">Active</option>
            <option value="pending">Pending KYC</option>
            <option value="rejected">Suspended</option>
          </select>
          <button type="button" data-export class="btn-secondary">
            ${icon('Download', 'h-4 w-4')} Export CSV
          </button>
        </div>

        <div data-table></div>
      </div>
    `);

    paintTabs();
    paintTable();
  }

  function paintTabs() {
    root.querySelector('[data-tabs]').innerHTML = toHTML(
      TABS.map(
        (t) => html`
          <button
            type="button"
            data-tab="${t.key}"
            class="rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${tab === t.key
              ? 'bg-brand-500 text-white'
              : 'text-slate-600 hover:bg-slate-100'}"
          >
            ${t.label}
          </button>
        `
      )
    );
  }

  function paintTable() {
    const host = root.querySelector('[data-table]');
    if (!host) return;

    const all = visible();
    const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    const current = Math.min(page, pageCount);
    const rows = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    if (rows.length === 0) {
      host.innerHTML = toHTML(EmptyState({ iconName: 'Users', title: 'No users match your filters' }));
      return;
    }

    host.innerHTML = toHTML(html`
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-500">
              <tr>
                <th class="px-5 py-3">User ID</th>
                <th class="px-5 py-3">Full Name</th>
                <th class="px-5 py-3">Role Badge</th>
                <th class="px-5 py-3">Location</th>
                <th class="px-5 py-3">Phone Number</th>
                <th class="px-5 py-3">Date Registered</th>
                <th class="px-5 py-3">Account Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${rows.map((u) => {
                const t = techByUser[u.id];
                const chip = t && STATUS_CHIP[t.verification_status];
                return html`
                  <tr class="hover:bg-slate-50">
                    <td class="px-5 py-3 font-mono text-xs font-medium text-brand-500">
                      ${displayId(u)}
                    </td>
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-3">
                        ${Avatar({ name: u.name, className: 'h-9 w-9 text-xs' })}
                        <div class="min-w-0">
                          <p class="truncate font-medium text-slate-900">${u.name}</p>
                          <p class="truncate text-xs text-slate-500">${u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3">
                      <span
                        class="inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[
                          u.role
                        ] || 'bg-slate-100 text-slate-600'}"
                        >${u.role}</span
                      >
                    </td>
                    <td class="px-5 py-3 text-slate-600">${t?.address || '—'}</td>
                    <td class="px-5 py-3 text-slate-600">${u.phone || '—'}</td>
                    <td class="px-5 py-3 text-slate-500">${formatDate(u.created_at)}</td>
                    <td class="px-5 py-3">
                      ${chip
                        ? html`<span
                            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${chip.cls}"
                          >
                            <span class="h-1.5 w-1.5 rounded-full ${chip.dot}"></span>${chip.label}
                          </span>`
                        : html`<span class="text-xs text-slate-400">—</span>`}
                    </td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-500"
        >
          <span>
            Showing ${(current - 1) * PAGE_SIZE + 1} to ${(current - 1) * PAGE_SIZE + rows.length} of
            ${all.length} entries
          </span>
          ${pageCount > 1 &&
          html`
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                data-page="${current - 1}"
                ${current === 1 ? 'disabled' : ''}
                class="rounded-md px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              ${Array.from({ length: pageCount }, (_, i) => i + 1).map(
                (n) => html`
                  <button
                    type="button"
                    data-page="${n}"
                    class="h-8 min-w-8 rounded-md px-2 transition ${n === current
                      ? 'bg-brand-500 font-medium text-white'
                      : 'hover:bg-slate-100'}"
                  >
                    ${n}
                  </button>
                `
              )}
              <button
                type="button"
                data-page="${current + 1}"
                ${current === pageCount ? 'disabled' : ''}
                class="rounded-md px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          `}
        </div>
      </div>
    `);
  }

  const offs = [
    on(root, 'click', '[data-tab]', (_e, btn) => {
      tab = btn.dataset.tab;
      page = 1;
      paintTabs();
      paintTable();
    }),
    on(root, 'input', '[data-q]', (e) => {
      q = e.target.value;
      page = 1;
      paintTable();
    }),
    on(root, 'change', '[data-status]', (e) => {
      status = e.target.value;
      page = 1;
      paintTable();
    }),
    on(root, 'click', '[data-export]', () => exportCsv()),
    on(root, 'click', '[data-page]', (_e, btn) => {
      page = Number(btn.dataset.page);
      paintTable();
    }),
  ];

  return () => {
    cancelled = true;
    for (const off of offs) off();
  };
}
