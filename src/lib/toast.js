/**
 * Toasts — the react-hot-toast replacement.
 *
 * Same call shapes the pages already use: `toast(msg, { icon })`,
 * `toast.success(msg)` and `toast.error(msg)`. Positioning and sizing carry
 * over from the old <Toaster> config in main.jsx: top-right, offset 84px to
 * clear the fixed header, and capped at the viewport width so a long API error
 * cannot widen a phone screen.
 */
import { html, toHTML } from './dom.js';

const DEFAULT_DURATION = 4000;

let container = null;

function getContainer() {
  if (container?.isConnected) return container;
  container = document.createElement('div');
  container.className =
    'pointer-events-none fixed right-4 top-[84px] z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col items-end gap-2';
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
}

const ICONS = {
  success: '<span class="text-base leading-none text-emerald-600">✓</span>',
  error: '<span class="text-base leading-none text-red-600">✕</span>',
};

function show(message, { icon, type, duration = DEFAULT_DURATION } = {}) {
  const parent = getContainer();

  const mark = icon
    ? `<span class="text-base leading-none">${toHTML(html`${icon}`)}</span>`
    : ICONS[type] || '';

  const node = document.createElement('div');
  node.className =
    'pointer-events-auto flex w-full items-start gap-2.5 rounded-xl bg-white px-4 py-3 text-sm ' +
    'text-slate-800 shadow-[0_4px_15px_rgba(0,0,0,0.15)] ring-1 ring-slate-200 ' +
    'transition duration-200 ease-out translate-y-[-8px] opacity-0';
  // The API sends multi-line notification bodies; keep the line breaks.
  node.innerHTML =
    `${mark}<span class="min-w-0 flex-1 whitespace-pre-line break-words">${toHTML(html`${message}`)}</span>`;

  parent.appendChild(node);
  requestAnimationFrame(() => node.classList.remove('translate-y-[-8px]', 'opacity-0'));

  const dismiss = () => {
    if (!node.isConnected) return;
    node.classList.add('opacity-0', 'translate-y-[-8px]');
    setTimeout(() => node.remove(), 200);
  };

  const timer = setTimeout(dismiss, duration);
  node.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss();
  });

  return dismiss;
}

const toast = (message, options) => show(message, options);
toast.success = (message, options) => show(message, { ...options, type: 'success' });
toast.error = (message, options) => show(message, { ...options, type: 'error' });

export default toast;
