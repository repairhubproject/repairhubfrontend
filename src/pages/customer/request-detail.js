import { html, toHTML, on, wireImageFallbacks } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api, { errMsg } from '../../api/client.js';
import { naira, formatDateTime, timeAgo } from '../../lib/format.js';
import {
  Spinner,
  EmptyState,
  StatusBadge,
  RatingStars,
  PageHeader,
  openModal,
} from '../../components/ui.js';
import toast from '../../lib/toast.js';

export default function RequestDetail(root, ctx) {
  const { id } = ctx.params;
  let request = null;
  let quotations = null;
  let cancelled = false;

  root.innerHTML = toHTML(Spinner());
  load();

  // Refresh while the request is open — new quotes also arrive as socket toasts.
  const timer = setInterval(load, 20000);

  async function load() {
    try {
      const [r, q] = await Promise.all([
        api.get(`/requests/${id}`),
        api.get(`/requests/${id}/quotations`),
      ]);
      if (cancelled) return;
      request = r.data.request;
      quotations = q.data.quotations;
      paint();
    } catch (err) {
      if (cancelled) return;
      toast.error(errMsg(err, 'Could not load request'));
      ctx.navigate('/requests');
    }
  }

  async function cancelRequest() {
    if (!window.confirm('Cancel this repair request? Technicians will no longer be able to quote.'))
      return;
    try {
      await api.patch(`/requests/${id}/cancel`);
      toast.success('Request cancelled');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  /**
   * "Received Quotation" document — Figma frame 976:573. The board also shows a
   * parts/labour breakdown, tax and validity date; the API's quotation carries
   * only amount, message and estimated_days, so those rows are omitted rather
   * than fabricated.
   */
  function openAcceptModal(quote) {
    const modal = openModal({
      title: 'Received Quotation',
      wide: true,
      content: html`
        <div class="space-y-6">
          <div class="grid gap-6 sm:grid-cols-2">
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="font-medium text-emerald-600">Quotation #</dt>
                <dd class="text-lg font-bold text-slate-900">QT-${quote.id}</dd>
              </div>
              <div class="flex gap-4">
                <dt class="w-28 shrink-0 text-slate-500">Repair ID</dt>
                <dd class="font-medium text-slate-900">#RPR-${request.id}</dd>
              </div>
              <div class="flex gap-4">
                <dt class="w-28 shrink-0 text-slate-500">Device</dt>
                <dd class="font-medium text-slate-900">${request.title}</dd>
              </div>
              <div class="flex gap-4">
                <dt class="w-28 shrink-0 text-slate-500">Issues</dt>
                <dd class="font-medium text-slate-900">${request.category_name}</dd>
              </div>
              <div class="flex gap-4">
                <dt class="w-28 shrink-0 text-slate-500">Technician</dt>
                <dd class="font-medium text-slate-900">${quote.technician_name}</dd>
              </div>
            </dl>

            <div class="rounded-xl border border-brand-500 p-4">
              <p class="mb-2 font-semibold text-slate-900">What&apos;s Included</p>
              ${quote.message
                ? html`<p class="text-sm text-slate-600">${quote.message}</p>`
                : html`<p class="text-sm text-slate-400">
                    The technician did not add a description for this quote.
                  </p>`}
              ${quote.estimated_days &&
              html`<p class="mt-3 text-sm text-slate-600">
                Estimated ${quote.estimated_days} day${quote.estimated_days > 1 ? 's' : ''} to
                complete
              </p>`}
            </div>
          </div>

          <div class="rounded-xl bg-slate-50 p-4">
            <p class="mb-3 font-semibold text-slate-900">Quotation Summary</p>
            <div class="flex items-center justify-between border-t border-slate-200 pt-3">
              <span class="font-medium text-slate-700">Total Amount</span>
              <span class="text-2xl font-bold text-slate-900">${naira(quote.amount)}</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">
              This is the full agreed price. Payment is only taken after the technician marks the
              repair completed.
            </p>
          </div>

          <p class="text-sm text-slate-600">
            Accepting declines all other pending quotes on this request automatically.
          </p>

          <div>
            <label class="label" for="sched"
              >Appointment date &amp; time
              <span class="font-normal text-slate-400">(optional)</span></label
            >
            <input
              id="sched"
              data-scheduled
              type="datetime-local"
              class="input"
              min="${new Date().toISOString().slice(0, 16)}"
            />
            <p class="mt-1 text-xs text-slate-500">
              Both of you get a reminder 1 hour before the appointment.
            </p>
          </div>
          <p data-sched-preview hidden class="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"></p>

          <div class="flex justify-end gap-2">
            <button type="button" data-cancel class="btn-secondary">Back</button>
            <button type="button" data-confirm class="btn-success">Confirm booking</button>
          </div>
        </div>
      `,
    });

    const schedField = modal.body.querySelector('[data-scheduled]');
    const preview = modal.body.querySelector('[data-sched-preview]');

    schedField.addEventListener('change', () => {
      if (!schedField.value) {
        preview.hidden = true;
        return;
      }
      preview.hidden = false;
      preview.innerHTML = toHTML(html`Scheduled for
        <span class="font-medium">${formatDateTime(new Date(schedField.value).toISOString())}</span>`);
    });

    modal.body.querySelector('[data-cancel]').addEventListener('click', () => modal.close());
    modal.body.querySelector('[data-confirm]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Booking…';
      modal.dismissable = false;
      try {
        const payload = schedField.value
          ? { scheduled_at: new Date(schedField.value).toISOString() }
          : {};
        const { data } = await api.post(`/quotations/${quote.id}/accept`, payload);
        toast.success('Booking created! The technician has been notified.');
        modal.dismissable = true;
        modal.close(true);
        ctx.navigate(`/bookings/${data.booking.id}`);
      } catch (err) {
        toast.error(errMsg(err, 'Could not accept quotation'));
        modal.dismissable = true;
        modal.close(true);
        load();
      }
    });
  }

  function paint() {
    const pending = quotations.filter((q) => q.status === 'pending');
    const visibleQuotes =
      request.status === 'open' ? pending : quotations.filter((q) => q.status === 'accepted');

    root.innerHTML = toHTML(html`
      <div class="mx-auto max-w-3xl">
        <a
          href="/requests"
          class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-500"
        >
          ${icon('ArrowLeft', 'h-4 w-4')} My requests
        </a>

        ${PageHeader({
          title: request.title,
          subtitle: `${request.category_name} · posted ${timeAgo(request.created_at)}`,
          action: html`
            <div class="flex items-center gap-3">
              ${StatusBadge(request.status)}
              ${request.status === 'open' &&
              html`<button type="button" data-cancel-request class="btn-danger min-h-0 px-3 py-1.5 text-xs">
                ${icon('XCircle', 'h-3.5 w-3.5')} Cancel
              </button>`}
            </div>
          `,
        })}

        <div class="card space-y-4 p-6">
          ${request.description && html`<p class="text-slate-700">${request.description}</p>`}
          ${request.photos?.length > 0 &&
          html`
            <div class="flex flex-wrap gap-3">
              ${request.photos.map(
                (url, i) => html`
                  <a
                    href="${url}"
                    target="_blank"
                    rel="noreferrer"
                    class="block h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    <img
                      src="${url}"
                      alt="Photo ${i + 1}"
                      class="h-full w-full object-cover"
                      data-fallback
                    />
                  </a>
                `
              )}
            </div>
          `}
          ${request.address &&
          html`<p class="flex items-center gap-1.5 text-sm text-slate-500">
            ${icon('MapPin', 'h-4 w-4')} ${request.address}
          </p>`}
        </div>

        <h2 class="mb-3 mt-8 text-lg font-semibold text-slate-900">
          ${request.status === 'open' ? `Quotations (${pending.length})` : 'Accepted quotation'}
        </h2>

        ${request.status === 'cancelled'
          ? EmptyState({ title: 'This request was cancelled' })
          : visibleQuotes.length === 0
            ? EmptyState({
                iconName: 'Hourglass',
                title: 'Waiting for quotations…',
                hint: "Verified technicians in your area have been notified. Quotes usually arrive shortly — you'll get a notification for each one. Cheapest appears first.",
              })
            : html`
                <div class="space-y-3">
                  ${request.status === 'open' &&
                  visibleQuotes.length > 1 &&
                  html`<p class="text-sm text-slate-500">
                    Sorted by price — compare ratings and timelines before choosing.
                  </p>`}
                  ${visibleQuotes.map(
                    (q, idx) => html`
                      <div
                        class="card p-5 ${idx === 0 && request.status === 'open'
                          ? 'ring-2 ring-emerald-500/30'
                          : ''}"
                      >
                        <div class="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p class="flex items-center gap-1.5 font-semibold text-slate-900">
                              ${q.technician_name} ${icon('BadgeCheck', 'h-4 w-4 text-brand-500')}
                            </p>
                            ${RatingStars({ value: q.rating_avg, count: q.rating_count })}
                          </div>
                          <div class="text-right">
                            <p class="text-2xl font-bold text-slate-900">${naira(q.amount)}</p>
                            ${idx === 0 &&
                            request.status === 'open' &&
                            visibleQuotes.length > 1 &&
                            html`<span class="text-xs font-medium text-emerald-600">Best price</span>`}
                          </div>
                        </div>
                        ${q.message && html`<p class="mt-3 text-sm text-slate-600">“${q.message}”</p>`}
                        <div
                          class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
                        >
                          <span class="flex items-center gap-1.5 text-sm text-slate-500">
                            ${icon('Clock3', 'h-4 w-4')}
                            ${q.estimated_days
                              ? `Estimated ${q.estimated_days} day${q.estimated_days > 1 ? 's' : ''}`
                              : 'No time estimate'}
                          </span>
                          ${request.status === 'open'
                            ? html`<button type="button" data-accept="${q.id}" class="btn-success">
                                Accept &amp; book
                              </button>`
                            : StatusBadge(q.status)}
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
    on(root, 'click', '[data-cancel-request]', () => cancelRequest()),
    on(root, 'click', '[data-accept]', (_e, btn) => {
      const quote = quotations.find((q) => String(q.id) === btn.dataset.accept);
      if (quote) openAcceptModal(quote);
    }),
  ];

  return () => {
    cancelled = true;
    clearInterval(timer);
    for (const off of offs) off();
  };
}
