/**
 * "Repair Quote" builder — Figma frame 2418:2586.
 *
 * The board itemises the quote (screen, labour, VAT…), but the API stores a
 * quotation as a single `amount` plus a free-text `message` with no line-item
 * model. The lines are summed into `amount` and rendered into `message`, so the
 * total is real and the customer still sees what they are paying for.
 *
 * Vanilla form of QuoteBuilder.jsx — opened imperatively instead of driven by a
 * `request` prop.
 */
import { html, toHTML, on, wireImageFallbacks } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import api, { errMsg } from '../api/client.js';
import { naira, formatDate } from '../lib/format.js';
import { openModal } from './ui.js';
import toast from '../lib/toast.js';

const BLANK_LINE = { label: '', amount: '' };

export function openQuoteBuilder({ request, onSubmitted } = {}) {
  if (!request) return null;

  let lines = [{ ...BLANK_LINE }];
  let busy = false;

  const modal = openModal({ title: 'Repair Quote', wide: true, content: '' });
  const body = modal.body;

  const total = () => lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  /** Read the DOM back into `lines` before any re-render, so typing isn't lost. */
  function syncLines() {
    lines = Array.from(body.querySelectorAll('[data-line]')).map((row) => ({
      label: row.querySelector('[data-label]').value,
      amount: row.querySelector('[data-amount]').value,
    }));
  }

  function paintTotal() {
    body.querySelector('[data-total]').textContent = naira(total());
  }

  function paint() {
    const photo = request.photos?.[0];

    body.innerHTML = toHTML(html`
      <div class="space-y-6">
        <!-- Device summary -->
        <div class="flex gap-4 rounded-xl bg-slate-50 p-4">
          ${photo
            ? html`<img src="${photo}" alt="" class="h-24 w-20 shrink-0 rounded-lg object-cover" data-fallback />`
            : html`<span
                class="flex h-24 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400"
                >${icon('Wrench', 'h-7 w-7')}</span
              >`}
          <div class="min-w-0 text-sm">
            <p class="font-bold text-slate-900">${request.title}</p>
            <p class="text-slate-600">${request.category_name}</p>
            <p class="mt-1 text-slate-500">Request #${request.id}</p>
            <p class="text-slate-500">Posted: ${formatDate(request.created_at)}</p>
            ${request.address && html`<p class="truncate text-slate-500">${request.address}</p>`}
          </div>
        </div>

        ${request.description &&
        html`
          <div class="flex gap-3">
            ${icon('MessageSquareWarning', 'h-6 w-6 shrink-0 text-slate-500')}
            <div>
              <p class="font-bold text-slate-900">Issue</p>
              <p class="text-slate-600">${request.description}</p>
            </div>
          </div>
        `}

        <!-- Breakdown -->
        <div>
          <p class="mb-3 text-center text-lg font-bold text-slate-900">Repair Breakdown</p>
          <div class="space-y-2">
            ${lines.map(
              (line) => html`
                <div data-line class="flex items-center gap-2">
                  <input
                    data-label
                    class="input flex-1"
                    placeholder="e.g. Screen, Labour, VAT"
                    value="${line.label}"
                  />
                  <input
                    data-amount
                    type="number"
                    min="0"
                    class="input w-36 shrink-0"
                    placeholder="₦0"
                    value="${line.amount}"
                  />
                  <button
                    type="button"
                    data-remove-line
                    class="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    aria-label="Remove line"
                  >
                    ${icon('Trash2', 'h-4 w-4')}
                  </button>
                </div>
              `
            )}
          </div>
          <button
            type="button"
            data-add-line
            class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:underline"
          >
            ${icon('Plus', 'h-4 w-4')} Add line
          </button>

          <div class="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
            <span class="font-bold text-slate-900">Total</span>
            <span data-total class="text-2xl font-extrabold text-slate-900">${naira(total())}</span>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            The customer sees this breakdown with the quote. Include VAT as its own line if it
            applies.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label" for="days">Estimated days</label>
            <input id="days" data-days type="number" min="1" class="input" placeholder="e.g. 1" />
          </div>
          <div>
            <label class="label" for="qnote"
              >Note <span class="font-normal text-slate-400">(optional)</span></label
            >
            <input id="qnote" data-note class="input" placeholder="e.g. Original part, 30-day warranty" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" data-cancel class="btn-secondary">Cancel</button>
          <button type="button" data-submit class="btn-primary">Send for Customer Approval</button>
        </div>
      </div>
    `);

    wireImageFallbacks(body);
  }

  /** Days + note live outside `lines`, so preserve them across re-renders. */
  function preserveExtras(fn) {
    const days = body.querySelector('[data-days]')?.value ?? '';
    const note = body.querySelector('[data-note]')?.value ?? '';
    fn();
    body.querySelector('[data-days]').value = days;
    body.querySelector('[data-note]').value = note;
  }

  on(body, 'input', '[data-amount]', () => {
    syncLines();
    paintTotal();
  });

  on(body, 'click', '[data-add-line]', () => {
    syncLines();
    lines = [...lines, { ...BLANK_LINE }];
    preserveExtras(paint);
  });

  on(body, 'click', '[data-remove-line]', (_e, btn) => {
    syncLines();
    const i = Array.from(body.querySelectorAll('[data-line]')).indexOf(btn.closest('[data-line]'));
    lines = lines.length === 1 ? [{ ...BLANK_LINE }] : lines.filter((_, j) => j !== i);
    preserveExtras(paint);
  });

  on(body, 'click', '[data-cancel]', () => modal.close());

  on(body, 'click', '[data-submit]', async (_e, btn) => {
    if (busy) return;
    syncLines();

    const filled = lines.filter((l) => l.label.trim() && Number(l.amount) > 0);
    if (filled.length === 0)
      return toast.error('Add at least one line with a description and price');
    if (total() <= 0) return toast.error('The quote total must be greater than zero');

    const breakdown = filled.map((l) => `${l.label.trim()}: ${naira(l.amount)}`).join('\n');
    const note = body.querySelector('[data-note]').value.trim();
    const message = [breakdown, note].filter(Boolean).join('\n\n');
    const estimatedDays = body.querySelector('[data-days]').value;

    busy = true;
    modal.dismissable = false;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await api.post(`/requests/${request.id}/quotations`, {
        amount: total(),
        message,
        estimated_days: estimatedDays ? Number(estimatedDays) : undefined,
      });
      toast.success('Quotation sent — the customer has been notified');
      modal.dismissable = true;
      modal.close();
      onSubmitted?.();
    } catch (err) {
      toast.error(errMsg(err, 'Could not submit quotation'));
      busy = false;
      modal.dismissable = true;
      btn.disabled = false;
      btn.textContent = 'Send for Customer Approval';
    }
  });

  paint();
  return modal;
}
