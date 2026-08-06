import { html, toHTML } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api from '../../api/client.js';
import { formatDate } from '../../lib/format.js';
import { Spinner, EmptyState, PageHeader } from '../../components/ui.js';

export default function Warranties(root) {
  let cancelled = false;
  root.innerHTML = toHTML(Spinner());

  api
    .get('/warranties/mine')
    .then(({ data }) => paint(data.warranties))
    .catch(() => paint([]));

  function paint(warranties) {
    if (cancelled) return;
    root.innerHTML = toHTML(html`
      <div class="mx-auto max-w-3xl">
        ${PageHeader({
          title: 'My warranties',
          subtitle: 'Digital warranties issued by technicians on your completed repairs.',
        })}
        ${warranties.length === 0
          ? EmptyState({
              iconName: 'ShieldCheck',
              title: 'No warranties yet',
              hint: 'When a technician completes a repair they can issue a warranty — it will appear here automatically.',
            })
          : html`
              <div class="space-y-4">
                ${warranties.map((w) => {
                  const expired = new Date(w.expires_at) < new Date();
                  return html`
                    <div class="card p-5 ${expired ? '' : 'border-emerald-200 bg-emerald-50/40'}">
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="font-semibold text-slate-900">${w.title}</p>
                          <p class="text-xs text-slate-500">
                            ${w.category_name} · repaired ${formatDate(w.completed_at)}
                          </p>
                        </div>
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${expired
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-700'}"
                        >
                          ${expired
                            ? icon('ShieldX', 'h-3.5 w-3.5')
                            : icon('ShieldCheck', 'h-3.5 w-3.5')}
                          ${expired ? 'Expired' : 'Active'}
                        </span>
                      </div>
                      <p class="mt-3 text-sm text-slate-700">
                        ${w.duration_days} day cover · ${expired ? 'expired' : 'expires'}
                        <span class="font-medium">${formatDate(w.expires_at)}</span>
                      </p>
                      ${w.terms && html`<p class="mt-2 text-sm text-slate-500">${w.terms}</p>`}
                    </div>
                  `;
                })}
              </div>
            `}
      </div>
    `);
  }

  return () => {
    cancelled = true;
  };
}
