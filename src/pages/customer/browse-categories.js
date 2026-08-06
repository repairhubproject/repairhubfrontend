import { html, toHTML } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api from '../../api/client.js';
import { Spinner, EmptyState, PageHeader } from '../../components/ui.js';

export default function BrowseCategories(root) {
  let cancelled = false;
  root.innerHTML = toHTML(Spinner());

  api
    .get('/categories')
    .then(({ data }) => paint(data.categories))
    .catch(() => paint([]));

  function paint(categories) {
    if (cancelled) return;
    root.innerHTML = toHTML(html`
      <div>
        ${PageHeader({
          title: 'Categories',
          subtitle: 'Pick what needs fixing to see verified technicians who handle it.',
        })}
        ${categories.length === 0
          ? EmptyState({ iconName: 'Wrench', title: 'No categories available' })
          : html`
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                ${categories.map(
                  (c) => html`
                    <a
                      href="/technicians?category=${c.slug}"
                      class="card-raised group flex flex-col items-center gap-3 p-5 text-center transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span
                        class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-surface text-brand-500"
                        >${icon('Wrench', 'h-7 w-7')}</span
                      >
                      <p class="font-bold leading-tight text-slate-900">${c.name}</p>
                      <span
                        class="mt-auto inline-flex items-center gap-1 text-xs font-medium text-brand-500 opacity-0 transition group-hover:opacity-100"
                      >
                        Find technicians ${icon('ArrowRight', 'h-3 w-3')}
                      </span>
                    </a>
                  `
                )}
              </div>
            `}
      </div>
    `);
  }

  return () => {
    cancelled = true;
  };
}
