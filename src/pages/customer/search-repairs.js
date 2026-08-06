import { html, toHTML, on } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api from '../../api/client.js';
import { formatDateTime } from '../../lib/format.js';
import { Spinner, EmptyState, StatusBadge } from '../../components/ui.js';

const RECENT_KEY = 'rh_recent_searches';
const PAGE_SIZE = 8;

/** Statuses a repair request moves through — drives the Status filter. */
const STATUSES = ['open', 'booked', 'in_progress', 'completed', 'cancelled'];

function readRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

export default function SearchRepairs(root) {
  let requests = null;
  let techByRequest = {};
  let q = '';
  let status = 'all';
  let from = '';
  let to = '';
  let showFilters = false;
  let page = 1;
  let recent = readRecent();
  let cancelled = false;

  root.innerHTML = toHTML(Spinner());

  Promise.all([
    api
      .get('/requests/mine')
      .then(({ data }) => (requests = data.requests))
      .catch(() => (requests = [])),
    // Bookings carry the assigned technician; key them by request so the table
    // can show who is handling each repair.
    api
      .get('/bookings/mine')
      .then(({ data }) => {
        techByRequest = Object.fromEntries(
          data.bookings.map((b) => [b.request_id, b.technician_name])
        );
      })
      .catch(() => {}),
  ]).then(() => {
    if (!cancelled) mount();
  });

  /* The shell is painted once; only the regions below it are repainted, so the
     search field keeps its focus and caret while you type. */
  function mount() {
    root.innerHTML = toHTML(html`
      <div>
        <h1 class="mb-6 text-xl font-bold text-slate-900">My Repairs</h1>

        <div class="mx-auto mb-4 max-w-3xl">
          <div class="flex h-12 items-center gap-2 rounded-xl border border-brand-500 px-4">
            ${icon('Search', 'h-4 w-4 shrink-0 text-slate-400')}
            <input
              data-q
              class="h-full w-full bg-transparent text-sm outline-none"
              placeholder="Search technicians, repairs or service….."
            />
          </div>
        </div>

        <div class="mb-4 flex justify-end">
          <button
            type="button"
            data-toggle-filters
            class="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle filters"
            aria-expanded="false"
          >
            ${icon('SlidersHorizontal', 'h-5 w-5')}
          </button>
        </div>

        <div data-filters></div>

        <div class="flex flex-col gap-8 lg:flex-row">
          <aside data-recent-rail class="w-full shrink-0 lg:w-48"></aside>
          <div data-results class="min-w-0 flex-1"></div>
        </div>
      </div>
    `);

    paintFilters();
    paintRecent();
    paintResults();
  }

  function filtered() {
    const term = q.trim().toLowerCase();
    return requests.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (from && new Date(r.created_at) < new Date(from)) return false;
      // `to` is a date; include the whole of that day.
      if (to && new Date(r.created_at) > new Date(`${to}T23:59:59`)) return false;
      if (!term) return true;
      return [r.title, r.description, r.category_name, techByRequest[r.id]]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }

  function paintFilters() {
    const host = root.querySelector('[data-filters]');
    root.querySelector('[data-toggle-filters]').setAttribute('aria-expanded', String(showFilters));

    if (!showFilters) {
      host.innerHTML = '';
      return;
    }

    host.innerHTML = toHTML(html`
      <div class="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 p-4">
        <label class="min-w-40 flex-1">
          <span class="label">Status</span>
          <select data-status class="input">
            <option value="all" ${status === 'all' ? 'selected' : ''}>Status: All</option>
            ${STATUSES.map(
              (s) => html`<option value="${s}" class="capitalize" ${status === s ? 'selected' : ''}>
                ${s.replace(/_/g, ' ')}
              </option>`
            )}
          </select>
        </label>
        <label class="min-w-40 flex-1">
          <span class="label">From</span>
          <input type="date" data-from class="input" value="${from}" />
        </label>
        <label class="min-w-40 flex-1">
          <span class="label">To</span>
          <input type="date" data-to class="input" value="${to}" />
        </label>
        <button type="button" data-clear class="btn-secondary">Clear All</button>
      </div>
    `);
  }

  function paintRecent() {
    const rail = root.querySelector('[data-recent-rail]');
    rail.hidden = recent.length === 0;
    rail.innerHTML = toHTML(html`
      <p class="mb-2 text-sm font-medium text-slate-700">Recent Searches</p>
      <ul class="space-y-1.5">
        ${recent.map(
          (r) => html`
            <li>
              <button
                type="button"
                data-recent="${r}"
                class="truncate text-sm text-slate-500 hover:text-brand-500"
              >
                ${r}
              </button>
            </li>
          `
        )}
      </ul>
    `);
  }

  function paintResults() {
    const host = root.querySelector('[data-results]');
    const all = filtered();
    const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    const current = Math.min(page, pageCount);
    const rows = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    if (rows.length === 0) {
      host.innerHTML = toHTML(
        EmptyState({
          iconName: 'ClipboardList',
          title: 'No repairs match your search',
          hint: 'Try a different term, widen the date range, or clear the filters.',
          action: html`<a href="/requests/new" class="btn-primary mt-2">Post a repair request</a>`,
        })
      );
      return;
    }

    host.innerHTML = toHTML(html`
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead class="text-slate-700">
            <tr>
              <th class="pb-4 font-medium">Device</th>
              <th class="pb-4 font-medium">Issues</th>
              <th class="pb-4 font-medium">Status</th>
              <th class="pb-4 font-medium">Technician</th>
              <th class="pb-4 font-medium">Requested On</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(
              (r) => html`
                <tr class="align-top">
                  <td class="py-4 pr-4">
                    <a href="/requests/${r.id}" class="font-medium text-slate-900 hover:text-brand-500"
                      >${r.title}</a
                    >
                  </td>
                  <td class="py-4 pr-4 text-slate-600">
                    ${r.description || r.category_name || '—'}
                  </td>
                  <td class="py-4 pr-4">${StatusBadge(r.status)}</td>
                  <td class="py-4 pr-4 text-slate-600">${techByRequest[r.id] || '—'}</td>
                  <td class="py-4 text-slate-600">${formatDateTime(r.created_at)}</td>
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>

      <div class="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>Showing ${rows.length} of ${all.length} result${all.length === 1 ? '' : 's'}</span>
        ${pageCount > 1 &&
        html`
          <div class="flex gap-1.5">
            ${Array.from({ length: pageCount }, (_, i) => i + 1).map(
              (n) => html`
                <button
                  type="button"
                  data-page="${n}"
                  class="h-8 min-w-8 rounded-md px-2 transition ${n === current
                    ? 'bg-brand-500 font-medium text-white'
                    : 'text-slate-600 hover:bg-slate-100'}"
                >
                  ${n}
                </button>
              `
            )}
          </div>
        `}
      </div>
    `);
  }

  const offs = [
    on(root, 'input', '[data-q]', (e) => {
      q = e.target.value;
      page = 1;
      paintResults();
    }),
    on(root, 'keydown', '[data-q]', (e) => {
      if (e.key !== 'Enter') return;
      const t = q.trim();
      if (!t) return;
      recent = [t, ...recent.filter((r) => r !== t)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
      paintRecent();
    }),
    on(root, 'click', '[data-toggle-filters]', () => {
      showFilters = !showFilters;
      paintFilters();
    }),
    on(root, 'change', '[data-status]', (e) => {
      status = e.target.value;
      page = 1;
      paintResults();
    }),
    on(root, 'change', '[data-from]', (e) => {
      from = e.target.value;
      paintResults();
    }),
    on(root, 'change', '[data-to]', (e) => {
      to = e.target.value;
      paintResults();
    }),
    on(root, 'click', '[data-clear]', () => {
      q = '';
      status = 'all';
      from = '';
      to = '';
      page = 1;
      root.querySelector('[data-q]').value = '';
      paintFilters();
      paintResults();
    }),
    on(root, 'click', '[data-recent]', (_e, btn) => {
      q = btn.dataset.recent;
      page = 1;
      root.querySelector('[data-q]').value = q;
      paintResults();
    }),
    on(root, 'click', '[data-page]', (_e, btn) => {
      page = Number(btn.dataset.page);
      paintResults();
    }),
  ];

  return () => {
    cancelled = true;
    for (const off of offs) off();
  };
}
