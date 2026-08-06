/**
 * Minimal observable store — the replacement for React context + useState.
 *
 * `get()` reads the current value, `set()` merges a patch and notifies, and
 * `subscribe()` returns an unsubscribe function. Views re-render themselves in
 * the callback; there is no diffing, which is fine because each view owns a
 * small container it can rewrite wholesale.
 */
export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  function get() {
    return state;
  }

  function set(patch) {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
    for (const fn of [...listeners]) fn(state);
    return state;
  }

  function subscribe(fn, { immediate = false } = {}) {
    listeners.add(fn);
    if (immediate) fn(state);
    return () => listeners.delete(fn);
  }

  return { get, set, subscribe };
}
