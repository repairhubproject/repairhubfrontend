import { html, toHTML, on } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import api, { errMsg } from '../api/client.js';
import { naira, formatDateTime, formatDate } from '../lib/format.js';
import { Spinner, StatusBadge, openModal } from '../components/ui.js';
import { getAuth } from '../state/auth.js';
import toast from '../lib/toast.js';

/**
 * Horizontal progress stepper from the Figma "Repair Tracking" frame (767:29).
 * The board's six labels are mapped onto the lifecycle the API actually
 * reports — booking status, job updates, warranty and payment — rather than
 * inventing states (the design's "Pending Parts" has no API equivalent).
 */
function Stepper(steps) {
  return html`
    <div class="card p-5">
      <p class="mb-5 text-sm font-medium text-slate-700">Repair Status</p>
      <ol class="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        ${steps.map(
          (s, i) => html`
            <li class="relative flex min-w-[120px] flex-1 flex-col items-center text-center">
              ${i < steps.length - 1 &&
              html`<span
                class="absolute left-1/2 top-5 -z-0 h-0.5 w-full ${steps[i + 1].done
                  ? 'bg-brand-500'
                  : 'bg-slate-200'}"
              ></span>`}
              <span
                class="relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${s.current
                  ? 'bg-brand-pill text-brand-500 ring-4 ring-brand-pill/50'
                  : s.done
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-400'}"
                >${icon(s.icon, 'h-[18px] w-[18px]')}</span
              >
              <p
                class="mt-2 text-xs font-medium leading-tight ${s.current
                  ? 'text-brand-500'
                  : s.done
                    ? 'text-slate-800'
                    : 'text-slate-400'}"
              >
                ${i + 1}. ${s.label}
              </p>
              ${s.at &&
              html`<p class="mt-0.5 text-[11px] leading-tight text-slate-400">
                ${formatDateTime(s.at)}
              </p>`}
            </li>
          `
        )}
      </ol>
    </div>
  `;
}

function InfoCell(label, value) {
  return html`
    <div class="min-w-0">
      <p class="text-xs text-slate-500">${label}</p>
      <p class="mt-1 truncate font-medium text-slate-900">${value || '—'}</p>
    </div>
  `;
}

// Stage names the board shows but the API has no status for — confirmed by
// logging a job update whose note is the stage label.
const NOTE_STAGES = ['Pending Parts / Waiting', 'Quality Check / Testing'];

export default function BookingDetail(root, ctx) {
  const { id } = ctx.params;
  const { user } = getAuth();
  const isTech = user.role === 'technician';
  const isCustomer = user.role === 'customer';

  let data = null;
  let payment = null;
  let reviewed = false;
  let busy = false;
  let cancelled = false;

  root.innerHTML = toHTML(Spinner());
  load();

  async function load() {
    try {
      const res = await api.get(`/bookings/${id}`);
      if (cancelled) return;
      data = res.data;
      paint();
    } catch (err) {
      if (cancelled) return;
      toast.error(errMsg(err, 'Could not load booking'));
      ctx.navigate('/bookings');
    }
  }

  /* ---------------------------- technician ---------------------------- */

  function openStatusModal(target) {
    const modal = openModal({
      title: target === 'completed' ? 'Mark repair as completed' : 'Start this repair',
      content: html`
        <div class="space-y-4">
          <div>
            <label class="label" for="note"
              >Progress note <span class="font-normal text-slate-400">(optional)</span></label
            >
            <textarea
              id="note"
              data-note
              rows="3"
              class="input"
              placeholder="${target === 'completed'
                ? 'e.g. Replaced screen and tested all functions'
                : 'e.g. Diagnosing the fault, parts ordered'}"
            ></textarea>
            <p class="mt-1 text-xs text-slate-500">
              The customer sees this note in their tracking timeline.
            </p>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" data-cancel class="btn-secondary">Cancel</button>
            <button
              type="button"
              data-confirm
              class="${target === 'completed' ? 'btn-success' : 'btn-primary'}"
            >
              ${target === 'completed' ? 'Complete job' : 'Start repair'}
            </button>
          </div>
        </div>
      `,
    });

    modal.body.querySelector('[data-cancel]').addEventListener('click', () => modal.close());
    modal.body.querySelector('[data-confirm]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Saving…';
      modal.dismissable = false;
      const note = modal.body.querySelector('[data-note]').value.trim();
      try {
        await api.patch(`/bookings/${id}/status`, { status: target, note: note || undefined });
        toast.success(target === 'completed' ? 'Job marked as completed 🎉' : 'Repair started');
        modal.dismissable = true;
        modal.close();
        load();
      } catch (err) {
        toast.error(errMsg(err));
        modal.dismissable = true;
        btn.disabled = false;
        btn.textContent = target === 'completed' ? 'Complete job' : 'Start repair';
      }
    });
  }

  /**
   * The board's "Pending Parts / Waiting" and "Quality Check / Testing" stages
   * are not statuses the API knows — its lifecycle is scheduled → in_progress →
   * completed. Confirming one appends a job update (which the customer sees on
   * their tracking timeline) while leaving the status at in_progress, with the
   * stage name as the note prefix so it can be detected on reload.
   */
  async function logStage(label) {
    if (busy) return;
    busy = true;
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'in_progress', note: label });
      toast.success(`${label} confirmed`);
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      busy = false;
    }
  }

  function openWarrantyModal() {
    const modal = openModal({
      title: 'Issue warranty',
      content: html`
        <div class="space-y-4">
          <div>
            <label class="label" for="wdays">Warranty duration (days)</label>
            <input id="wdays" data-days type="number" min="1" class="input" value="30" />
          </div>
          <div>
            <label class="label" for="wterms"
              >Terms <span class="font-normal text-slate-400">(optional)</span></label
            >
            <textarea
              id="wterms"
              data-terms
              rows="3"
              class="input"
              placeholder="e.g. Covers the replaced screen. Physical/liquid damage not covered."
            ></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" data-cancel class="btn-secondary">Cancel</button>
            <button type="button" data-confirm class="btn-primary">Issue warranty</button>
          </div>
        </div>
      `,
    });

    modal.body.querySelector('[data-cancel]').addEventListener('click', () => modal.close());
    modal.body.querySelector('[data-confirm]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Issuing…';
      modal.dismissable = false;
      const terms = modal.body.querySelector('[data-terms]').value.trim();
      try {
        await api.post(`/bookings/${id}/warranty`, {
          duration_days: Number(modal.body.querySelector('[data-days]').value),
          terms: terms || undefined,
        });
        toast.success('Warranty issued — the customer has been notified');
        modal.dismissable = true;
        modal.close();
        load();
      } catch (err) {
        toast.error(errMsg(err));
        modal.dismissable = true;
        btn.disabled = false;
        btn.textContent = 'Issue warranty';
      }
    });
  }

  /* ----------------------------- customer ----------------------------- */

  async function startPayment() {
    if (busy) return;
    busy = true;
    try {
      const res = await api.post(`/payments/bookings/${id}/initialize`);
      payment = res.data;
      window.open(payment.authorization_url, '_blank', 'noopener');
      paint();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      busy = false;
    }
  }

  async function verifyPayment() {
    if (busy) return;
    busy = true;
    try {
      await api.get(`/payments/verify/${payment.reference}`);
      toast.success('Payment confirmed — thank you!');
      payment = null;
      await load();
    } catch (err) {
      toast.error(errMsg(err, 'Payment not confirmed yet'));
    } finally {
      busy = false;
    }
  }

  function openReviewModal() {
    let rating = 5;

    const modal = openModal({
      title: 'Rate this repair',
      content: html`
        <div class="space-y-4">
          <div>
            <span class="label">Your rating</span>
            <div data-stars class="flex gap-1"></div>
          </div>
          <div>
            <label class="label" for="comment"
              >Comment <span class="font-normal text-slate-400">(optional)</span></label
            >
            <textarea
              id="comment"
              data-comment
              rows="3"
              class="input"
              placeholder="How was the service? Was the price fair? Would you recommend them?"
            ></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" data-cancel class="btn-secondary">Cancel</button>
            <button type="button" data-confirm class="btn-primary">Submit review</button>
          </div>
        </div>
      `,
    });

    const starsEl = modal.body.querySelector('[data-stars]');
    function paintStars() {
      starsEl.innerHTML = toHTML(
        [1, 2, 3, 4, 5].map(
          (i) => html`
            <button type="button" data-star="${i}" aria-label="${i} stars">
              ${icon(
                'Star',
                `h-8 w-8 transition ${
                  i <= rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-200 text-slate-200 hover:fill-amber-200 hover:text-amber-200'
                }`
              )}
            </button>
          `
        )
      );
    }
    paintStars();

    on(starsEl, 'click', '[data-star]', (_e, btn) => {
      rating = Number(btn.dataset.star);
      paintStars();
    });

    modal.body.querySelector('[data-cancel]').addEventListener('click', () => modal.close());
    modal.body.querySelector('[data-confirm]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Submitting…';
      modal.dismissable = false;
      const comment = modal.body.querySelector('[data-comment]').value.trim();
      try {
        await api.post(`/reviews/bookings/${id}`, { rating, comment: comment || undefined });
        toast.success('Review submitted — thanks for the feedback!');
        reviewed = true;
        modal.dismissable = true;
        modal.close();
        paint();
      } catch (err) {
        // 409 means it was already reviewed — hide the button either way.
        if (err.response?.status === 409) reviewed = true;
        toast.error(errMsg(err));
        modal.dismissable = true;
        btn.disabled = false;
        btn.textContent = 'Submit review';
      }
    });
  }

  /* ------------------------------- render ------------------------------ */

  function paint() {
    const { booking, job_updates, warranty, payment: paid } = data;

    const started = job_updates.find((u) => u.status === 'in_progress');
    const finished = job_updates.find((u) => u.status === 'completed');
    const isDone = booking.status === 'completed';

    const steps = [
      { label: 'Requested', icon: 'ClipboardList', done: true, at: booking.created_at },
      { label: 'Technician Assigned', icon: 'UserCheck', done: true, at: booking.created_at },
      {
        label: 'In Progress',
        icon: 'Wrench',
        done: Boolean(started) || isDone,
        current: booking.status === 'in_progress',
        at: started?.created_at,
      },
      {
        label: 'Completed',
        icon: 'PackageSearch',
        done: isDone,
        current: isDone && !warranty,
        at: finished?.created_at || booking.completed_at,
      },
      {
        label: 'Warranty Issued',
        icon: 'BadgeCheck',
        done: Boolean(warranty),
        current: Boolean(warranty) && paid?.status !== 'paid',
        at: warranty?.created_at,
      },
      {
        label: 'Paid',
        icon: 'Banknote',
        done: paid?.status === 'paid',
        current: paid?.status === 'paid',
        at: paid?.paid_at,
      },
    ];

    const loggedStage = (label) => job_updates.find((u) => u.note?.startsWith(label));

    const stageCards = [
      { label: 'Accepted', confirmed: true, at: booking.created_at },
      {
        label: 'In Progress',
        confirmed: Boolean(started) || isDone,
        at: started?.created_at,
        action: 'start',
        disabled: booking.status !== 'scheduled',
      },
      ...NOTE_STAGES.map((label) => {
        const hit = loggedStage(label);
        return {
          label,
          confirmed: Boolean(hit),
          at: hit?.created_at,
          action: 'stage',
          // Only meaningful once the job is actually underway.
          disabled: booking.status !== 'in_progress',
        };
      }),
      {
        label: 'Fixed / Resolved',
        confirmed: isDone,
        at: finished?.created_at || booking.completed_at,
        action: 'complete',
        disabled: !['scheduled', 'in_progress'].includes(booking.status),
      },
      // Approval is the customer's payment — the technician cannot confirm it.
      { label: 'Approved', confirmed: paid?.status === 'paid', at: paid?.paid_at },
    ];

    const bannerText = {
      scheduled: 'The technician is scheduled and will start soon',
      in_progress: 'The technician is actively working on the repair',
      completed:
        paid?.status === 'paid'
          ? 'This repair is complete and paid'
          : 'Repair complete — payment is outstanding',
      cancelled: 'This booking was cancelled',
    }[booking.status];

    // Newest first, matching the design's activity feed.
    const activity = [
      ...job_updates.map((u) => ({
        at: u.created_at,
        text:
          u.status === 'in_progress'
            ? `${booking.technician_name} started working on your repair`
            : `${booking.technician_name} marked the repair completed`,
        note: u.note,
      })),
      { at: booking.created_at, text: `${booking.technician_name} was assigned to you` },
    ].sort((a, b) => new Date(b.at) - new Date(a.at));

    root.innerHTML = toHTML(html`
      <div>
        <!-- Header -->
        <div class="mb-6 flex items-center gap-4">
          <a href="/bookings" class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-500">
            ${icon('ArrowLeft', 'h-5 w-5')} ${isTech ? 'My jobs' : 'Repair Details'}
          </a>
          <h1 class="flex-1 text-center text-xl font-bold text-slate-900">Repair Tracking</h1>
          ${StatusBadge(booking.status)}
        </div>

        <!-- Summary card -->
        <div class="mb-6 grid grid-cols-2 gap-5 rounded-2xl border border-brand-500 p-5 lg:grid-cols-4">
          ${InfoCell('Repair ID', `#RPR-${booking.id}`)} ${InfoCell('Device', booking.title)}
          ${InfoCell('Issues', booking.category_name)}
          ${InfoCell('Requested', formatDateTime(booking.created_at))}
        </div>

        <div class="mb-6">${Stepper(steps)}</div>

        ${bannerText &&
        html`<p
          class="mb-8 rounded-xl bg-brand-surface px-4 py-3 text-center text-sm font-medium text-brand-500"
        >
          ${bannerText}
        </p>`}

        <!-- Technician "Repair Progress" stage panel — Figma frame 2418:1862 -->
        ${isTech &&
        html`
          <div class="mb-8">
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              ${stageCards.map(
                (s) => html`
                  <div
                    class="flex items-center justify-between gap-3 rounded-xl p-4 ${s.confirmed
                      ? 'bg-slate-100'
                      : 'border border-slate-300'}"
                  >
                    <div class="min-w-0">
                      <p class="truncate font-medium text-slate-900">${s.label}</p>
                      <p class="text-xs text-slate-500">
                        ${s.at
                          ? formatDateTime(s.at)
                          : s.confirmed
                            ? 'Confirmed'
                            : 'Not yet confirmed'}
                      </p>
                    </div>
                    ${s.confirmed
                      ? html`<span
                          class="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                          >Confirmed</span
                        >`
                      : s.action
                        ? html`<button
                            type="button"
                            data-stage-action="${s.action}"
                            data-stage-label="${s.label}"
                            ${s.disabled ? 'disabled' : ''}
                            class="btn-primary min-h-0 shrink-0 px-3 py-1.5 text-xs"
                          >
                            Confirm
                          </button>`
                        : html`<span class="shrink-0 text-xs text-slate-400">Customer</span>`}
                  </div>
                `
              )}
            </div>

            ${isDone &&
            !warranty &&
            html`<button type="button" data-warranty class="btn-primary mt-5">
              ${icon('ShieldCheck', 'h-4 w-4')} Issue warranty
            </button>`}
          </div>
        `}
        ${!isTech &&
        html`
          <div class="grid gap-8 lg:grid-cols-2">
            <!-- Activity -->
            <section>
              <h2 class="mb-4 font-semibold text-slate-900">Repair Activity</h2>
              <ul class="space-y-5">
                ${activity.map(
                  (a) => html`
                    <li>
                      <p class="text-sm text-slate-500">${formatDateTime(a.at)}</p>
                      <p class="text-sm text-slate-800">${a.text}</p>
                      ${a.note && html`<p class="mt-0.5 text-sm text-slate-500">“${a.note}”</p>`}
                    </li>
                  `
                )}
              </ul>
            </section>

            <!-- Details -->
            <section>
              <h2 class="mb-4 font-semibold text-slate-900">Details</h2>
              <dl class="space-y-4 text-sm">
                <div class="flex gap-4">
                  <dt class="w-44 shrink-0 text-slate-500">Assigned Technician</dt>
                  <dd class="font-medium text-slate-900">${booking.technician_name}</dd>
                </div>
                <div class="flex gap-4">
                  <dt class="w-44 shrink-0 text-slate-500">Agreed price</dt>
                  <dd class="font-medium text-slate-900">${naira(booking.quoted_amount)}</dd>
                </div>
                ${booking.scheduled_at &&
                html`
                  <div class="flex gap-4">
                    <dt class="w-44 shrink-0 text-slate-500">Appointment</dt>
                    <dd class="font-medium text-slate-900">
                      ${formatDateTime(booking.scheduled_at)}
                    </dd>
                  </div>
                `}
                <div class="flex gap-4">
                  <dt class="w-44 shrink-0 text-slate-500">Warranty</dt>
                  <dd class="font-medium text-slate-900">
                    ${warranty
                      ? `${warranty.duration_days} days — expires ${formatDate(warranty.expires_at)}`
                      : 'Not issued'}
                  </dd>
                </div>
                <div class="flex gap-4">
                  <dt class="w-44 shrink-0 text-slate-500">Payment</dt>
                  <dd class="font-medium text-slate-900">
                    ${paid?.status === 'paid'
                      ? `Paid ${naira(paid.amount)} on ${formatDate(paid.paid_at)}`
                      : 'Outstanding'}
                  </dd>
                </div>
              </dl>

              ${warranty?.terms &&
              html`<p class="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                ${icon('ShieldCheck', 'mr-1.5 inline h-4 w-4')}${warranty.terms}
              </p>`}

              <!-- Actions -->
              <div class="mt-6 space-y-2">
                ${isCustomer &&
                isDone &&
                paid?.status !== 'paid' &&
                !payment &&
                html`<button type="button" data-pay class="btn-success w-full">
                  ${icon('CreditCard', 'h-4 w-4')} Pay ${naira(booking.quoted_amount)}
                </button>`}
                ${isCustomer &&
                payment &&
                html`
                  <a
                    href="${payment.authorization_url}"
                    target="_blank"
                    rel="noreferrer"
                    class="btn-secondary w-full"
                  >
                    ${icon('ExternalLink', 'h-4 w-4')} Open checkout page
                  </a>
                  <button type="button" data-verify class="btn-success w-full">
                    I&apos;ve paid — confirm payment
                  </button>
                  <p class="text-center text-xs text-slate-400">Ref: ${payment.reference}</p>
                `}
                ${isCustomer &&
                isDone &&
                !reviewed &&
                html`<button type="button" data-review class="btn-secondary w-full">
                  ${icon('Star', 'h-4 w-4')} Leave a review
                </button>`}
              </div>
            </section>
          </div>
        `}
      </div>
    `);
  }

  /* Delegated actions survive every re-render of `root`. */
  const offs = [
    on(root, 'click', '[data-stage-action]', (_e, btn) => {
      const action = btn.dataset.stageAction;
      if (action === 'start') openStatusModal('in_progress');
      else if (action === 'complete') openStatusModal('completed');
      else logStage(btn.dataset.stageLabel);
    }),
    on(root, 'click', '[data-warranty]', () => openWarrantyModal()),
    on(root, 'click', '[data-pay]', () => startPayment()),
    on(root, 'click', '[data-verify]', (_e, btn) => {
      btn.disabled = true;
      btn.textContent = 'Verifying…';
      verifyPayment();
    }),
    on(root, 'click', '[data-review]', () => openReviewModal()),
  ];

  return () => {
    cancelled = true;
    for (const off of offs) off();
  };
}
