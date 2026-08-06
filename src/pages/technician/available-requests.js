import { html, toHTML, on, wireImageFallbacks } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api, { errMsg } from '../../api/client.js';
import { timeAgo } from '../../lib/format.js';
import { Spinner, EmptyState } from '../../components/ui.js';
import { openQuoteBuilder } from '../../components/quote-builder.js';
import { isDismissed } from '../../lib/dismissed.js';

export default function AvailableRequests(root) {
  let requests = null;
  let error = null;
  let cancelled = false;

  root.innerHTML = toHTML(Spinner());
  load();

  async function load() {
    try {
      const { data } = await api.get('/requests/available');
      // Requests the technician declined are hidden locally — the API has no
      // decline endpoint, so this is a client-side preference only.
      requests = data.requests.filter((r) => !isDismissed(r.id));
      error = null;
    } catch (err) {
      // 403 here means "profile not approved yet" — an expected state.
      if (err.response?.status === 403) {
        error =
          err.response.data?.error || 'Your profile must be approved before you can see requests.';
      } else {
        error = errMsg(err);
      }
      requests = [];
    }
    if (!cancelled) paint();
  }

  function paint() {
    root.innerHTML = toHTML(html`
      <div>
        <div class="mb-8 flex items-center gap-4">
          <a href="/dashboard" class="text-slate-700 hover:text-brand-500" aria-label="Back to dashboard">
            ${icon('ArrowLeft', 'h-6 w-6')}
          </a>
          <h1 class="flex-1 text-right text-2xl font-extrabold text-slate-900">New Jobs</h1>
        </div>

        ${error
          ? EmptyState({
              iconName: 'Clock',
              title: 'Not available yet',
              hint: error,
              action: html`<a href="/tech/profile" class="btn-secondary mt-2">Check my profile</a>`,
            })
          : requests.length === 0
            ? html`
                <div class="card-raised mx-auto max-w-xl px-6 py-14 text-center">
                  <span
                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"
                    >${icon('Briefcase', 'h-8 w-8')}</span
                  >
                  <p class="mt-5 text-2xl font-extrabold text-slate-900">No New Jobs Nearby</p>
                  <p class="mx-auto mt-2 max-w-sm text-slate-500">
                    Job requests will appear here as customers in your area post them.
                  </p>
                  <button type="button" data-refresh class="btn-secondary mt-6">
                    ${icon('RefreshCw', 'h-4 w-4')} Refresh Area
                  </button>
                </div>
              `
            : html`
                <div class="mb-4 flex justify-end">
                  <button type="button" data-refresh class="btn-secondary">
                    ${icon('RefreshCw', 'h-4 w-4')} Refresh Area
                  </button>
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  ${requests.map(
                    (r) => html`
                      <div class="card-raised flex flex-col p-5">
                        <div class="flex items-start justify-between gap-2">
                          <a
                            href="/tech/requests/${r.id}"
                            class="font-bold text-slate-900 hover:text-brand-500"
                            >${r.title}</a
                          >
                          ${r.distance_km != null &&
                          html`<span
                            class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                            >${Number(r.distance_km).toFixed(1)} km</span
                          >`}
                        </div>
                        <p class="mt-0.5 text-xs text-slate-500">
                          ${r.category_name} · posted ${timeAgo(r.created_at)}
                        </p>
                        ${r.description &&
                        html`<p class="mt-2 line-clamp-3 text-sm text-slate-600">${r.description}</p>`}
                        ${r.photos?.length > 0 &&
                        html`
                          <div class="mt-3 flex gap-2">
                            ${r.photos.slice(0, 4).map(
                              (url) => html`
                                <span
                                  class="block h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                >
                                  <img src="${url}" alt="" class="h-full w-full object-cover" data-fallback />
                                </span>
                              `
                            )}
                          </div>
                        `}
                        <div
                          class="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3"
                        >
                          <span class="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                            ${icon('MapPin', 'h-3.5 w-3.5 shrink-0')}
                            <span class="truncate">${r.address || 'No address'}</span>
                          </span>
                          <div class="flex shrink-0 gap-2">
                            <a
                              href="/tech/requests/${r.id}"
                              class="btn-secondary min-h-0 px-3 py-1.5 text-xs"
                              >Details</a
                            >
                            <button
                              type="button"
                              data-quote="${r.id}"
                              class="btn-primary min-h-0 px-3 py-1.5 text-xs"
                            >
                              Send quotation
                            </button>
                          </div>
                        </div>
                      </div>
                    `
                  )}
                </div>
              `}
      </div>
    `);

    wireImageFallbacks(root);
  }

  const offs = [
    on(root, 'click', '[data-refresh]', () => load()),
    on(root, 'click', '[data-quote]', (_e, btn) => {
      const request = requests.find((r) => String(r.id) === btn.dataset.quote);
      if (request) openQuoteBuilder({ request, onSubmitted: load });
    }),
  ];

  return () => {
    cancelled = true;
    for (const off of offs) off();
  };
}
