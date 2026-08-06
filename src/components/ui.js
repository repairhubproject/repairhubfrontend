/**
 * Shared UI pieces — the ui.jsx replacement.
 *
 * The presentational ones are plain functions returning markup. Modal is the
 * exception: without a render cycle to react to an `open` prop, it is an
 * imperative controller you open and close, returning the panel element so the
 * caller can bind its own buttons.
 */
import { html, toHTML, cls } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { STATUS_STYLES, statusLabel, initials } from '../lib/format.js';

export function Spinner(label = 'Loading…') {
  return html`
    <div class="flex items-center justify-center gap-2 py-16 text-slate-500">
      ${icon('Loader2', 'h-5 w-5 animate-spin')}
      <span class="text-sm">${label}</span>
    </div>
  `;
}

export function EmptyState({ iconName = 'Inbox', title, hint, action } = {}) {
  return html`
    <div
      class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center sm:px-6 sm:py-14"
    >
      ${icon(iconName, 'h-10 w-10 text-slate-300')}
      <p class="font-medium text-slate-700">${title}</p>
      ${hint && html`<p class="max-w-sm text-sm text-slate-500">${hint}</p>`}
      ${action}
    </div>
  `;
}

export function StatusBadge(status) {
  const tone = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-500/20';
  return html`
    <span
      class="inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${tone}"
      >${statusLabel(status)}</span
    >
  `;
}

export function RatingStars({ value = 0, count, size = 'h-4 w-4' } = {}) {
  const rating = Number(value) || 0;
  const stars = [1, 2, 3, 4, 5].map((i) =>
    icon(
      'Star',
      cls(size, i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200')
    )
  );
  return html`
    <span class="inline-flex items-center gap-1">
      <span class="inline-flex">${stars}</span>
      ${count !== undefined &&
      html`<span class="text-xs text-slate-500">
        ${rating > 0 ? rating.toFixed(1) : 'New'} ${count > 0 ? `(${count})` : ''}
      </span>`}
    </span>
  `;
}

export function PageHeader({ title, subtitle, action } = {}) {
  return html`
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">${title}</h1>
        ${subtitle && html`<p data-subtitle class="mt-1 text-sm text-slate-500">${subtitle}</p>`}
      </div>
      ${action}
    </div>
  `;
}

export function Avatar({ name, src, className = 'h-11 w-11 text-base' } = {}) {
  if (src) {
    return html`<img src="${src}" alt="${name || ''}" class="${className} shrink-0 rounded-full object-cover" />`;
  }
  return html`
    <span
      class="${className} flex shrink-0 items-center justify-center rounded-full bg-brand-pill font-bold text-brand-500"
      >${initials(name)}</span
    >
  `;
}

/* --------------------------------- Modal ---------------------------------- */

let openCount = 0;

/**
 * Open a modal. `content` is markup for the body.
 *
 * Returns { panel, body, close }. `body` is the content wrapper — query it to
 * wire buttons. `close()` is idempotent and also runs `onClose`.
 * Set `dismissable: false` (while a request is in flight) to ignore backdrop,
 * Escape and the ✕ button, matching the old `!busy && setOpen(false)` guards.
 */
export function openModal({ title, content, wide = false, onClose } = {}) {
  const host = document.createElement('div');
  host.className = 'fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4';
  host.setAttribute('role', 'dialog');
  host.setAttribute('aria-modal', 'true');
  host.innerHTML = toHTML(html`
    <div class="absolute inset-0 bg-slate-900/50" data-backdrop></div>
    <div
      class="card relative max-h-[90dvh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-2xl sm:p-6 ${wide
        ? 'max-w-2xl'
        : 'max-w-md'}"
    >
      <div class="mb-4 flex items-start justify-between gap-4">
        <h3 class="text-lg font-semibold text-slate-900">${title}</h3>
        <button
          type="button"
          data-close
          class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          ${icon('X', 'h-5 w-5')}
        </button>
      </div>
      <div data-body>${content}</div>
    </div>
  `);

  // Without this the page behind an open modal still scrolls under your finger.
  if (openCount === 0) document.body.style.overflow = 'hidden';
  openCount += 1;

  document.body.appendChild(host);

  const handle = {
    panel: host,
    body: host.querySelector('[data-body]'),
    dismissable: true,
    close(force = false) {
      if (!host.isConnected) return;
      if (!handle.dismissable && !force) return;
      host.remove();
      openCount = Math.max(0, openCount - 1);
      if (openCount === 0) document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      onClose?.();
    },
    /** Swap the body contents in place — used by multi-step modal flows. */
    setContent(markup) {
      handle.body.innerHTML = toHTML(markup);
      return handle.body;
    },
  };

  function onKey(e) {
    if (e.key === 'Escape') handle.close();
  }
  document.addEventListener('keydown', onKey);

  host.querySelector('[data-backdrop]').addEventListener('click', () => handle.close());
  host.querySelector('[data-close]').addEventListener('click', () => handle.close());

  return handle;
}
