import { html, toHTML, on } from '../lib/dom.js';
import api from '../api/client.js';
import { naira, formatDateTime } from '../lib/format.js';
import { Spinner, EmptyState, StatusBadge, PageHeader } from '../components/ui.js';
import { getAuth } from '../state/auth.js';

const FILTERS = [
  { key: 'active', label: 'Active', match: (b) => ['scheduled', 'in_progress'].includes(b.status) },
  { key: 'completed', label: 'Completed', match: (b) => b.status === 'completed' },
  { key: 'all', label: 'All', match: () => true },
];

export default function BookingsList(root) {
  const { user } = getAuth();
  const isTech = user.role === 'technician';
  let bookings = null;
  let filter = 'active';
  let cancelled = false;

  root.innerHTML = toHTML(Spinner());

  api
    .get('/bookings/mine')
    .then(({ data }) => {
      bookings = data.bookings;
    })
    .catch(() => {
      bookings = [];
    })
    .finally(() => {
      if (!cancelled) paint();
    });

  function paint() {
    const active = FILTERS.find((f) => f.key === filter);
    const visible = bookings.filter(active.match);

    root.innerHTML = toHTML(html`
      <div>
        ${PageHeader({
          title: isTech ? 'My jobs' : 'My bookings',
          subtitle: isTech
            ? 'Repairs you have been booked for.'
            : 'Repairs you have booked with a technician.',
        })}

        <div class="mb-4 flex flex-wrap gap-2">
          ${FILTERS.map(
            (f) => html`
              <button
                type="button"
                data-filter="${f.key}"
                class="rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
              >
                ${f.label} (${bookings.filter(f.match).length})
              </button>
            `
          )}
        </div>

        ${visible.length === 0
          ? EmptyState({
              iconName: 'CalendarCheck',
              title: `No ${filter === 'all' ? '' : filter} ${isTech ? 'jobs' : 'bookings'}`.replace(
                /\s+/g,
                ' '
              ),
              hint: isTech
                ? 'Quote on available repair requests — accepted quotes become bookings here.'
                : 'Accept a quotation on one of your repair requests to create a booking.',
              action: html`<a href="${isTech ? '/tech/requests' : '/requests'}" class="btn-primary mt-2"
                >${isTech ? 'Browse available requests' : 'View my requests'}</a
              >`,
            })
          : html`
              <div class="grid gap-4 sm:grid-cols-2">
                ${visible.map(
                  (b) => html`
                    <a href="/bookings/${b.id}" class="card p-5 transition hover:shadow-md">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="truncate font-semibold text-slate-900">${b.title}</p>
                          <p class="text-xs text-slate-500">${b.category_name}</p>
                        </div>
                        ${StatusBadge(b.status)}
                      </div>
                      <div
                        class="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3"
                      >
                        <div class="min-w-0">
                          <p class="text-xs text-slate-400">${isTech ? 'Customer' : 'Technician'}</p>
                          <p class="truncate text-sm font-medium text-slate-700">
                            ${isTech ? b.customer_name : b.technician_name}
                          </p>
                          ${b.scheduled_at &&
                          html`<p class="mt-1 text-xs text-slate-500">
                            ${formatDateTime(b.scheduled_at)}
                          </p>`}
                        </div>
                        <p class="shrink-0 text-lg font-bold text-slate-900">
                          ${naira(b.quoted_amount)}
                        </p>
                      </div>
                    </a>
                  `
                )}
              </div>
            `}
      </div>
    `);
  }

  const off = on(root, 'click', '[data-filter]', (_e, btn) => {
    filter = btn.dataset.filter;
    paint();
  });

  return () => {
    cancelled = true;
    off();
  };
}
