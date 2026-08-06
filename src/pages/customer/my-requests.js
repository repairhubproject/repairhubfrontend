import { html, toHTML, wireImageFallbacks } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api from '../../api/client.js';
import { timeAgo } from '../../lib/format.js';
import { Spinner, EmptyState, StatusBadge, PageHeader } from '../../components/ui.js';

export default function MyRequests(root) {
  let cancelled = false;
  root.innerHTML = toHTML(Spinner());

  api
    .get('/requests/mine')
    .then(({ data }) => paint(data.requests))
    .catch(() => paint([]));

  function paint(requests) {
    if (cancelled) return;
    root.innerHTML = toHTML(html`
      <div>
        ${PageHeader({
          title: 'My repair requests',
          subtitle: 'Every job you have posted, newest first.',
          action: html`<a href="/requests/new" class="btn-primary"
            >${icon('PlusCircle', 'h-4 w-4')} New request</a
          >`,
        })}
        ${requests.length === 0
          ? EmptyState({
              iconName: 'ClipboardList',
              title: 'No repair requests yet',
              hint: "Describe what's broken and verified technicians near you will send quotations.",
              action: html`<a href="/requests/new" class="btn-primary mt-2"
                >Create your first request</a
              >`,
            })
          : html`
              <div class="grid gap-4 sm:grid-cols-2">
                ${requests.map(
                  (r) => html`
                    <a
                      href="/requests/${r.id}"
                      class="card flex flex-col p-5 transition hover:shadow-md"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="truncate font-semibold text-slate-900">${r.title}</p>
                          <p class="text-xs text-slate-500">
                            ${r.category_name} · posted ${timeAgo(r.created_at)}
                          </p>
                        </div>
                        ${StatusBadge(r.status)}
                      </div>
                      ${r.description &&
                      html`<p class="mt-2 line-clamp-2 text-sm text-slate-600">${r.description}</p>`}
                      ${r.photos?.length > 0 &&
                      html`
                        <div class="mt-3 flex gap-2">
                          ${r.photos.slice(0, 4).map(
                            (url) => html`
                              <span
                                class="block h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                              >
                                <img src="${url}" alt="" class="h-full w-full object-cover" data-fallback />
                              </span>
                            `
                          )}
                        </div>
                      `}
                      <p class="mt-auto flex items-center gap-1 pt-3 text-xs text-slate-500">
                        ${icon('MapPin', 'h-3.5 w-3.5 shrink-0')}
                        <span class="truncate">${r.address || 'No address given'}</span>
                      </p>
                    </a>
                  `
                )}
              </div>
            `}
      </div>
    `);

    wireImageFallbacks(root);
  }

  return () => {
    cancelled = true;
  };
}
