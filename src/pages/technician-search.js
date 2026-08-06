import { html, toHTML } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import api from '../api/client.js';
import { naira } from '../lib/format.js';
import { Spinner, EmptyState, RatingStars, PageHeader } from '../components/ui.js';
import { getAuth } from '../state/auth.js';
import toast from '../lib/toast.js';

export default function TechnicianSearch(root, ctx) {
  const { user } = getAuth();
  const category = ctx.query.get('category') || '';
  const urlQuery = ctx.query.get('q') || '';

  let coords = null;
  let cancelled = false;

  const content = html`
    ${PageHeader({
      title: 'Find a technician',
      subtitle: 'Browse verified repair technicians',
    })}

    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative sm:flex-1">
        ${icon('Search', 'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400')}
        <input
          data-q
          class="input pl-9"
          placeholder="Search by name or skill (e.g. screen replacement)"
          value="${urlQuery}"
        />
      </div>
      <!-- On phones the filter row keeps select + buttons side by side. -->
      <div class="flex gap-2 sm:contents">
        <select data-category class="input min-w-0 flex-1 sm:w-56 sm:flex-none">
          <option value="">All categories</option>
        </select>
        <button data-near class="btn-secondary shrink-0 px-3" title="Use my precise location">
          ${icon('LocateFixed', 'h-4 w-4')} <span class="hidden sm:inline">Near me</span>
        </button>
        <button data-search class="btn-primary shrink-0">Search</button>
      </div>
    </div>

    <div data-results></div>
  `;

  // Signed-out visitors get this page inside the marketing shell, which has no
  // padded container of its own.
  root.innerHTML = toHTML(
    user ? content : html`<div class="mx-auto w-[95%] max-w-6xl py-10">${content}</div>`
  );

  const subtitleEl = root.querySelector('[data-subtitle]');
  const results = root.querySelector('[data-results]');
  const queryField = root.querySelector('[data-q]');
  const categorySelect = root.querySelector('[data-category]');

  api
    .get('/categories')
    .then(({ data }) => {
      if (cancelled) return;
      categorySelect.innerHTML = toHTML(html`
        <option value="">All categories</option>
        ${data.categories.map(
          (c) => html`<option value="${c.slug}" ${c.slug === category ? 'selected' : ''}>${c.name}</option>`
        )}
      `);
    })
    .catch(() => {});

  categorySelect.addEventListener('change', () => {
    const next = new URLSearchParams(ctx.query);
    if (categorySelect.value) next.set('category', categorySelect.value);
    else next.delete('category');
    ctx.setQuery(next);
  });

  root.querySelector('[data-search]').addEventListener('click', () => search());
  queryField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') search();
  });

  root.querySelector('[data-near]').addEventListener('click', () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        toast.success('Using your precise location');
        search();
      },
      () => toast.error('Could not get your location — using approximate IP location instead')
    );
  });

  function paintSubtitle(center) {
    if (!subtitleEl) return;
    subtitleEl.textContent = center
      ? `Showing verified technicians near ${center.city || 'you'} (${
          center.source === 'client' ? 'GPS' : 'approximate IP'
        } location)`
      : 'Browse verified repair technicians';
  }

  async function search(term = queryField.value) {
    results.innerHTML = toHTML(Spinner('Finding technicians…'));
    try {
      const { data } = await api.get('/technicians', {
        params: {
          category: category || undefined,
          q: term.trim() || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        },
      });
      if (cancelled) return;
      paintSubtitle(data.search_center);
      paintTechs(data.technicians);
    } catch {
      if (!cancelled) paintTechs([]);
    }
  }

  function paintTechs(techs) {
    if (techs.length === 0) {
      results.innerHTML = toHTML(
        EmptyState({
          iconName: 'UserSearch',
          title: 'No technicians found',
          hint: 'Try a different category, widen your search, or check back soon — new technicians are verified daily.',
        })
      );
      return;
    }

    results.innerHTML = toHTML(html`
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        ${techs.map(
          (t) => html`
            <a
              href="/technicians/${t.id}"
              class="card p-5 transition hover:border-brand-pill hover:shadow-md"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span class="truncate">${t.name}</span>
                    ${icon('BadgeCheck', 'h-4 w-4 shrink-0 text-brand-500')}
                  </p>
                  ${RatingStars({ value: t.rating_avg, count: t.rating_count })}
                </div>
                ${t.distance_km != null &&
                html`<span
                  class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                  >${Number(t.distance_km).toFixed(1)} km</span
                >`}
              </div>
              ${t.bio && html`<p class="mt-2 line-clamp-2 text-sm text-slate-600">${t.bio}</p>`}
              <div class="mt-3 flex flex-wrap gap-1.5">
                ${t.categories.slice(0, 3).map(
                  (c) => html`<span
                    class="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-medium text-brand-500"
                    >${c.name}</span
                  >`
                )}
                ${t.categories.length > 3 &&
                html`<span class="text-xs text-slate-400">+${t.categories.length - 3} more</span>`}
              </div>
              <div
                class="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm"
              >
                <span class="flex min-w-0 items-center gap-1 text-slate-500">
                  ${icon('MapPin', 'h-3.5 w-3.5 shrink-0')}
                  <span class="truncate">${t.address || 'Nigeria'}</span>
                </span>
                ${t.base_fee != null &&
                Number(t.base_fee) > 0 &&
                html`<span class="shrink-0 whitespace-nowrap font-medium text-slate-700"
                  >from ${naira(t.base_fee)}</span
                >`}
              </div>
            </a>
          `
        )}
      </div>
    `);
  }

  search(urlQuery);

  return () => {
    cancelled = true;
  };
}
