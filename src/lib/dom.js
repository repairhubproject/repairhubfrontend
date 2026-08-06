/**
 * The JSX replacement.
 *
 * `html` is a tagged template that escapes every interpolated value, so markup
 * built from API data is safe by default the way JSX was. Values that are
 * already markup (nested `html` results, `icon()` output) carry a marker and
 * pass through untouched; anything else is escaped.
 *
 * Arrays are joined with no separator, which makes `${items.map(...)}` behave
 * like `{items.map(...)}` did in JSX. `null`, `undefined` and `false` render as
 * nothing, so `${cond && html`…`}` also carries over unchanged.
 */

const RAW = Symbol('raw');

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Mark a string as trusted markup that must not be escaped again. */
export function raw(value) {
  return { [RAW]: String(value) };
}

export function isRaw(value) {
  return Boolean(value) && typeof value === 'object' && RAW in value;
}

/** The escaped-string form of any interpolated value. */
function stringify(value) {
  if (value == null || value === false || value === true) return '';
  if (Array.isArray(value)) return value.map(stringify).join('');
  if (isRaw(value)) return value[RAW];
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += stringify(values[i]) + strings[i + 1];
  return raw(out);
}

/** The plain string behind a raw value — for assigning to innerHTML. */
export function toHTML(value) {
  return stringify(value);
}

/** Build a detached element from markup. Expects exactly one root node. */
export function el(markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = toHTML(markup).trim();
  return tpl.content.firstElementChild;
}

/** Replace a container's contents with rendered markup. */
export function render(container, markup) {
  container.innerHTML = toHTML(markup);
  return container;
}

/**
 * Conditional class names: `cls('btn', isOn && 'btn-on')`.
 * Falsy entries drop out, which is what the JSX template literals did inline.
 */
export function cls(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Delegated event binding. React re-attached handlers on every re-render for
 * free; here a page can re-render its list container without losing listeners,
 * because the listener lives on the stable parent and matches by selector.
 */
export function on(root, event, selector, handler) {
  const listener = (e) => {
    const match = e.target.closest(selector);
    if (match && root.contains(match)) handler(e, match);
  };
  root.addEventListener(event, listener);
  return () => root.removeEventListener(event, listener);
}

/** Direct (non-delegated) binding, returning an unsubscribe for symmetry. */
export function listen(target, event, handler, options) {
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
}

/**
 * Dim images that fail to load, the way the JSX `onError` handlers did.
 * Call after painting markup that contains `<img data-fallback>`; API photo
 * URLs can 404 once a Cloudinary asset is removed.
 */
export function wireImageFallbacks(root) {
  for (const img of root.querySelectorAll('img[data-fallback]')) {
    img.addEventListener('error', () => {
      img.style.opacity = 0.3;
    });
  }
}

/** First match inside a root — the querySelector calls read better named. */
export function qs(root, selector) {
  return root.querySelector(selector);
}

export function qsa(root, selector) {
  return Array.from(root.querySelectorAll(selector));
}
