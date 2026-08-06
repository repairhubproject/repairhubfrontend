import { html, toHTML } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import api from '../api/client.js';
import { naira, formatDate } from '../lib/format.js';
import { Spinner, EmptyState, RatingStars, Avatar } from '../components/ui.js';
import { getAuth } from '../state/auth.js';

export default function TechnicianDetail(root, ctx) {
  const { user } = getAuth();
  let cancelled = false;

  // Signed-out visitors get this page inside the marketing shell, which has no
  // padded container of its own.
  const wrap = (markup) =>
    user ? markup : html`<div class="mx-auto w-[95%] max-w-6xl py-10">${markup}</div>`;

  root.innerHTML = toHTML(wrap(html`<div data-body>${Spinner('Loading profile…')}</div>`));
  const body = root.querySelector('[data-body]');

  api
    .get(`/technicians/${ctx.params.id}`)
    .then(({ data }) => {
      if (!cancelled) paint(data.technician);
    })
    .catch(() => {
      if (cancelled) return;
      body.innerHTML = toHTML(
        EmptyState({
          title: 'Technician not found',
          action: html`<a href="/technicians" class="btn-secondary mt-2">Back to search</a>`,
        })
      );
    });

  function paint(tech) {
    body.innerHTML = toHTML(html`
      <div class="mx-auto max-w-3xl">
        <a
          href="/technicians"
          class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-500"
        >
          ${icon('ArrowLeft', 'h-4 w-4')} Back to search
        </a>

        <div class="card p-6 sm:p-8">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              ${Avatar({ name: tech.name, className: 'h-16 w-16 text-xl' })}
              <div>
                <h1 class="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  ${tech.name} ${icon('BadgeCheck', 'h-6 w-6 text-brand-500')}
                </h1>
                <div class="mt-1">
                  ${RatingStars({ value: tech.rating_avg, count: tech.rating_count, size: 'h-5 w-5' })}
                </div>
              </div>
            </div>
            ${tech.base_fee != null &&
            Number(tech.base_fee) > 0 &&
            html`
              <div class="rounded-xl bg-slate-50 px-4 py-2 text-right">
                <p class="text-xs text-slate-500">Base call-out fee</p>
                <p class="text-lg font-bold text-slate-900">${naira(tech.base_fee)}</p>
              </div>
            `}
          </div>

          <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <span class="flex items-center gap-1.5">
              ${icon('MapPin', 'h-4 w-4 text-slate-400')} ${tech.address || 'Nigeria'}
            </span>
            <span class="flex items-center gap-1.5">
              ${icon('Clock', 'h-4 w-4 text-slate-400')} Serves within ${tech.service_radius_km} km
            </span>
          </div>

          ${tech.bio && html`<p class="mt-4 text-slate-700">${tech.bio}</p>`}
          ${tech.skills &&
          html`<p class="mt-2 text-sm text-slate-500">
            <span class="font-medium text-slate-700">Skills:</span> ${tech.skills}
          </p>`}

          <div class="mt-4 flex flex-wrap gap-2">
            ${(tech.categories || []).map(
              (c) => html`<span
                class="rounded-full bg-brand-surface px-3 py-1 text-sm font-medium text-brand-500"
                >${c.name}</span
              >`
            )}
          </div>

          ${(!user || user.role === 'customer') &&
          html`
            <div class="mt-6 rounded-xl bg-brand-surface p-4 text-sm text-brand-500">
              Post a repair request in one of this technician&apos;s categories and they&apos;ll be
              notified to send you a quotation.
              <div class="mt-3">
                <a href="${user ? '/requests/new' : '/register'}" class="btn-primary"
                  >Request a repair</a
                >
              </div>
            </div>
          `}
        </div>

        <h2 class="mb-3 mt-8 flex items-center gap-2 text-lg font-semibold text-slate-900">
          ${icon('MessageSquare', 'h-5 w-5 text-slate-400')} Reviews (${tech.reviews?.length || 0})
        </h2>
        ${!tech.reviews?.length
          ? EmptyState({
              title: 'No reviews yet',
              hint: 'Reviews appear here after customers complete repairs with this technician.',
            })
          : html`
              <div class="space-y-3">
                ${tech.reviews.map(
                  (r) => html`
                    <div class="card p-4">
                      <div class="flex items-center justify-between">
                        <p class="font-medium text-slate-900">${r.customer_name}</p>
                        <span class="text-xs text-slate-400">${formatDate(r.created_at)}</span>
                      </div>
                      ${RatingStars({ value: r.rating })}
                      ${r.comment && html`<p class="mt-1.5 text-sm text-slate-600">${r.comment}</p>`}
                    </div>
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
