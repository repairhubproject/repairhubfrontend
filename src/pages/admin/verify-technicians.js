import { html, toHTML, on } from '../../lib/dom.js';
import { icon } from '../../lib/icons.js';
import api, { errMsg } from '../../api/client.js';
import { formatDate } from '../../lib/format.js';
import {
  Spinner,
  EmptyState,
  StatusBadge,
  PageHeader,
  RatingStars,
} from '../../components/ui.js';
import toast from '../../lib/toast.js';

const TABS = ['pending', 'approved', 'rejected'];

export default function VerifyTechnicians(root) {
  let status = 'pending';
  let techs = null;
  let cancelled = false;

  paint();
  load();

  async function load() {
    techs = null;
    paint();
    try {
      const { data } = await api.get('/admin/technicians', { params: { status } });
      techs = data.technicians || data.profiles || [];
    } catch (err) {
      toast.error(errMsg(err));
      techs = [];
    }
    if (!cancelled) paint();
  }

  async function decide(id, decision, btn) {
    btn.disabled = true;
    try {
      await api.patch(`/admin/technicians/${id}/verify`, { decision });
      toast.success(`Technician ${decision}`);
      load();
    } catch (err) {
      toast.error(errMsg(err));
      btn.disabled = false;
    }
  }

  function paint() {
    root.innerHTML = toHTML(html`
      <div>
        ${PageHeader({
          title: 'Technician verification',
          subtitle: 'Cross-check identity documents and bank account names before approving.',
        })}

        <div class="mb-4 flex flex-wrap gap-2">
          ${TABS.map(
            (t) => html`
              <button
                type="button"
                data-tab="${t}"
                class="rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${status === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
              >
                ${t}
              </button>
            `
          )}
        </div>

        ${!techs
          ? Spinner()
          : techs.length === 0
            ? EmptyState({ iconName: 'ShieldQuestion', title: `No ${status} technicians` })
            : html`
                <div class="space-y-4">
                  ${techs.map(
                    (t) => html`
                      <div class="card p-5">
                        <div class="flex flex-wrap items-start justify-between gap-4">
                          <div class="min-w-0">
                            <p class="font-semibold text-slate-900">${t.name}</p>
                            <p class="break-all text-sm text-slate-500">
                              ${t.email}${t.phone ? ` · ${t.phone}` : ''}
                            </p>
                            <div class="mt-1">
                              ${RatingStars({ value: t.rating_avg, count: t.rating_count })}
                            </div>
                          </div>
                          <div class="flex items-center gap-2">
                            ${StatusBadge(t.verification_status)}
                            <span class="text-xs text-slate-400">since ${formatDate(t.created_at)}</span>
                          </div>
                        </div>

                        ${t.bio && html`<p class="mt-3 text-sm text-slate-600">${t.bio}</p>`}

                        <div class="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-600">
                          <span class="flex items-center gap-1.5">
                            ${icon('MapPin', 'h-4 w-4 text-slate-400')} ${t.address || 'No address'} ·
                            ${t.service_radius_km} km radius
                          </span>
                          ${t.id_document_url
                            ? html`<a
                                href="${t.id_document_url}"
                                target="_blank"
                                rel="noreferrer"
                                class="flex items-center gap-1.5 text-brand-500 hover:underline"
                              >
                                ${icon('FileText', 'h-4 w-4')} View ID document
                              </a>`
                            : html`<span class="flex items-center gap-1.5 text-amber-600">
                                ${icon('FileText', 'h-4 w-4')} No ID document uploaded
                              </span>`}
                          ${t.account_name
                            ? html`<span class="flex items-center gap-1.5">
                                ${icon('Landmark', 'h-4 w-4 text-slate-400')} Bank name:
                                <span class="font-medium">${t.account_name}</span>
                              </span>`
                            : html`<span class="flex items-center gap-1.5 text-slate-400">
                                ${icon('Landmark', 'h-4 w-4')} Bank not verified yet
                              </span>`}
                        </div>

                        <div class="mt-3 flex flex-wrap gap-1.5">
                          ${(t.categories || []).map(
                            (c) => html`<span
                              class="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-medium text-brand-500"
                              >${c.name}</span
                            >`
                          )}
                        </div>

                        ${status !== 'approved'
                          ? html`
                              <div class="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                                <button
                                  type="button"
                                  data-decide="approved"
                                  data-id="${t.id}"
                                  class="btn-success"
                                >
                                  ${icon('BadgeCheck', 'h-4 w-4')} Approve
                                </button>
                                ${status !== 'rejected' &&
                                html`<button
                                  type="button"
                                  data-decide="rejected"
                                  data-id="${t.id}"
                                  class="btn-danger"
                                >
                                  ${icon('XCircle', 'h-4 w-4')} Reject
                                </button>`}
                              </div>
                            `
                          : html`
                              <div class="mt-4 border-t border-slate-100 pt-4">
                                <button
                                  type="button"
                                  data-decide="rejected"
                                  data-id="${t.id}"
                                  class="btn-danger"
                                >
                                  ${icon('XCircle', 'h-4 w-4')} Revoke approval
                                </button>
                              </div>
                            `}
                      </div>
                    `
                  )}
                </div>
              `}
      </div>
    `);
  }

  const offs = [
    on(root, 'click', '[data-tab]', (_e, btn) => {
      status = btn.dataset.tab;
      load();
    }),
    on(root, 'click', '[data-decide]', (_e, btn) => {
      decide(Number(btn.dataset.id), btn.dataset.decide, btn);
    }),
  ];

  return () => {
    cancelled = true;
    for (const off of offs) off();
  };
}
