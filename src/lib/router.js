/**
 * History-API router — the react-router-dom replacement.
 *
 * Routes are matched in declaration order against patterns with `:param`
 * segments and a trailing `*` catch-all, mirroring the old <Routes> table.
 * A matched route renders into the layout's outlet; the layout itself is only
 * torn down and rebuilt when the shell it needs changes (guest vs app), so
 * navigating inside the app does not flash the sidebar.
 *
 * Link handling is delegated from document: any <a href="/…"> without a target
 * or modifier key navigates in-place, which is what <Link> gave us.
 */

const routes = [];
let notFound = null;
let resolveShell = () => null; // (ctx) => { key, mount(container) -> outletEl }
let rootEl = null;

let currentShell = null;
let currentOutlet = null;
let disposePage = null;

/** Compile "/requests/:id" into a matcher. */
function compile(pattern) {
  if (pattern === '*') return { test: () => ({}) };
  const names = [];
  const source = pattern
    .split('/')
    .map((seg) => {
      if (seg.startsWith(':')) {
        names.push(seg.slice(1));
        return '([^/]+)';
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const re = new RegExp(`^${source}/?$`);
  return {
    test(path) {
      const m = re.exec(path);
      if (!m) return null;
      const params = {};
      names.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1])));
      return params;
    },
  };
}

/**
 * Register a route.
 * `guard(ctx)` may return a path string to redirect to instead of rendering.
 */
export function route(pattern, page, { guard } = {}) {
  routes.push({ pattern, matcher: compile(pattern), page, guard });
}

export function setNotFound(page) {
  notFound = page;
}

/** How a matched route gets a container to render into. */
export function setShellResolver(fn) {
  resolveShell = fn;
}

export function navigate(to, { replace = false } = {}) {
  const url = new URL(to, window.location.origin);
  const same = url.pathname + url.search === window.location.pathname + window.location.search;
  if (same) return;
  if (replace) window.history.replaceState({}, '', url);
  else window.history.pushState({}, '', url);
  handleLocation();
}

/**
 * Re-render the current URL, rebuilding the shell even if the path is
 * unchanged — used after a logout that leaves you on the same URL.
 */
export function refresh() {
  currentShell = null;
  handleLocation();
}

export function currentPath() {
  return window.location.pathname;
}

function buildContext(params) {
  const query = new URLSearchParams(window.location.search);
  return {
    params,
    query,
    path: window.location.pathname,
    /** Rewrite the query string without a full shell rebuild. */
    setQuery(next, { replace = true } = {}) {
      const search = next.toString();
      navigate(window.location.pathname + (search ? `?${search}` : ''), { replace });
    },
    navigate,
  };
}

function handleLocation() {
  const path = window.location.pathname;

  let matched = null;
  for (const r of routes) {
    const params = r.matcher.test(path);
    if (params) {
      matched = { ...r, params };
      break;
    }
  }

  const ctx = buildContext(matched ? matched.params : {});

  if (matched?.guard) {
    const redirect = matched.guard(ctx);
    if (redirect) {
      navigate(redirect, { replace: true });
      return;
    }
  }

  const page = matched ? matched.page : notFound;
  if (!page) return;

  // Swap the surrounding shell only when it actually changes.
  const shell = resolveShell(ctx);
  if (!shell) return;

  if (disposePage) {
    disposePage();
    disposePage = null;
  }

  if (shell.key !== currentShell?.key) {
    currentShell?.destroy?.();
    rootEl.innerHTML = '';
    currentOutlet = shell.mount(rootEl);
    currentShell = shell;
  }

  currentShell.onNavigate?.(ctx);
  currentOutlet.innerHTML = '';
  window.scrollTo(0, 0);

  // A page may return a cleanup function (timers, sockets, listeners).
  const cleanup = page(currentOutlet, ctx);
  disposePage = typeof cleanup === 'function' ? cleanup : null;
}

export function startRouter(mountPoint) {
  rootEl = mountPoint;

  window.addEventListener('popstate', handleLocation);

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.dataset.native === 'true') return;
    const href = a.getAttribute('href');
    if (!href.startsWith('/')) return; // external, hash, mailto…
    e.preventDefault();
    navigate(href);
  });

  handleLocation();
}
