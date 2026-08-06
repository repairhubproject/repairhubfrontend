/**
 * "Job Details" — Figma frame 2418:1299.
 *
 * The board's "Accept Job" is a direct accept, but the marketplace does not work
 * that way: a technician submits a quotation and the *customer* accepts it. So
 * Accept opens the quote builder. "Decline Request" has no endpoint either and
 * only hides the request on this browser (see lib/dismissed.js).
 *
 * The board also shows a customer star-rating, a price and an estimated work
 * time. Customers are not rated by the API, an open request has no price (that
 * is what the technician is about to quote), and there is no work-time field —
 * so those are omitted rather than invented.
 */
import { html, toHTML, on, wireImageFallbacks } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api, { errMsg } from '../../api/client.js';
import { timeAgo, formatDateTime } from '../../lib/format.js';
import { Spinner, StatusBadge } from '../../components/ui.js';
import { openQuoteBuilder } from '../../components/quote-builder.js';
import { dismiss } from '../../lib/dismissed.js';
import toast from '../../lib/toast.js';

export default function JobDetails(root, ctx) {
  const { id } = ctx.params;
  let request = null;
  let distance = null;
  let cancelled = false;

  root.innerHTML = toHTML(Spinner());
  load();

  // Only the available-requests list carries distance_km, so pick it up there.
  api
    .get('/requests/available')
    .then(({ data }) => {
      const match = data.requests.find((r) => String(r.id) === String(id));
      if (match?.distance_km != null && !cancelled) {
        distance = match.distance_km;
        if (request) paint();
      }
    })
    .catch(() => {});

  async function load() {
    try {
      const { data } = await api.get(`/requests/${id}`);
      if (cancelled) return;
      request = data.request;
      paint();
    } catch (err) {
      if (cancelled) return;
      toast.error(errMsg(err, 'Could not load this job'));
      ctx.navigate('/tech/requests');
    }
  }

  function paint() {
    const open = request.status === 'open';

    root.innerHTML = toHTML(html`
      <div class="mx-auto max-w-3xl">
        <div class="mb-6 flex items-center gap-4">
          <a
            href="/tech/requests"
            class="text-slate-700 hover:text-brand-500"
            aria-label="Back to new jobs"
          >
            ${icon('ArrowLeft', 'h-6 w-6')}
          </a>
          <h1 class="flex-1 text-center text-xl font-bold text-slate-900">Job Details</h1>
          ${StatusBadge(request.status)}
        </div>

        <!-- Hero photo -->
        <div class="relative mb-5 overflow-hidden rounded-2xl bg-slate-100">
          ${request.photos?.length > 0
            ? html`<img
                src="${request.photos[0]}"
                alt="${request.title}"
                class="h-64 w-full object-cover sm:h-80"
                data-fallback
              />`
            : html`<div class="flex h-64 w-full items-center justify-center text-slate-300 sm:h-80">
                ${icon('Image', 'h-12 w-12')}
              </div>`}
          ${distance != null &&
          html`<span
            class="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur"
          >
            ${icon('MapPin', 'h-3.5 w-3.5')} ${Number(distance).toFixed(1)} km away
          </span>`}
        </div>

        <!-- Extra photos -->
        ${request.photos?.length > 1 &&
        html`
          <div class="mb-5 flex flex-wrap gap-2">
            ${request.photos.slice(1).map(
              (url) => html`
                <a
                  href="${url}"
                  target="_blank"
                  rel="noreferrer"
                  class="block h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                >
                  <img src="${url}" alt="" class="h-full w-full object-cover" data-fallback />
                </a>
              `
            )}
          </div>
        `}

        <div class="card p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-lg font-bold text-slate-900">${request.title}</p>
              <p class="text-sm text-slate-500">
                Request #${request.id} · posted ${timeAgo(request.created_at)}
              </p>
            </div>
          </div>

          <dl class="mt-5 space-y-4 border-t border-slate-100 pt-5">
            <div class="flex gap-3">
              ${icon('Smartphone', 'h-5 w-5 shrink-0 text-slate-400')}
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Device</dt>
                <dd class="font-semibold text-slate-900">${request.title}</dd>
              </div>
            </div>
            <div class="flex gap-3">
              ${icon('Wrench', 'h-5 w-5 shrink-0 text-slate-400')}
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Service Requested
                </dt>
                <dd class="font-semibold text-slate-900">${request.category_name}</dd>
              </div>
            </div>
            ${request.address &&
            html`
              <div class="flex gap-3">
                ${icon('MapPin', 'h-5 w-5 shrink-0 text-slate-400')}
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Location</dt>
                  <dd class="font-semibold text-slate-900">${request.address}</dd>
                </div>
              </div>
            `}
            <div class="flex gap-3">
              ${icon('Clock', 'h-5 w-5 shrink-0 text-slate-400')}
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Requested</dt>
                <dd class="font-semibold text-slate-900">${formatDateTime(request.created_at)}</dd>
              </div>
            </div>
          </dl>

          ${request.description &&
          html`
            <div class="mt-5 border-t border-slate-100 pt-5">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Customer Note</p>
              <p class="mt-1.5 text-slate-600">“${request.description}”</p>
            </div>
          `}
        </div>

        ${open
          ? html`
              <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" data-decline class="btn-secondary sm:w-48">Decline Request</button>
                <button type="button" data-accept class="btn-primary sm:w-48">Accept Job</button>
              </div>
            `
          : html`<p
              class="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-500"
            >
              This request is no longer open for quotations.
            </p>`}
      </div>
    `);

    wireImageFallbacks(root);
  }

  const offs = [
    on(root, 'click', '[data-decline]', () => {
      dismiss(id);
      toast('Request hidden on this device', { icon: '👋' });
      ctx.navigate('/tech/requests');
    }),
    on(root, 'click', '[data-accept]', () =>
      openQuoteBuilder({
        request,
        onSubmitted: () => ctx.navigate('/tech/requests'),
      })
    ),
  ];

  return () => {
    cancelled = true;
    for (const off of offs) off();
  };
}
