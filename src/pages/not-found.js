import { html, toHTML } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getAuth } from '../state/auth.js';

export default function NotFound(root) {
  const { user } = getAuth();
  root.innerHTML = toHTML(html`
    <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      ${icon('Compass', 'h-12 w-12 text-slate-300')}
      <p class="mt-4 text-5xl font-bold text-slate-900">404</p>
      <h1 class="mt-2 text-lg font-semibold text-slate-800">This page doesn&apos;t exist</h1>
      <p class="mt-1 max-w-sm text-sm text-slate-500">
        The link may be broken, or the page may have moved.
      </p>
      <a href="${user ? '/dashboard' : '/'}" class="btn-primary mt-6"
        >${user ? 'Back to dashboard' : 'Back to home'}</a
      >
    </div>
  `);
}
