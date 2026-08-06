import { html, toHTML } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import api from '../api/client.js';
import { formatDate } from '../lib/format.js';
import { Spinner, PageHeader, Avatar } from '../components/ui.js';
import { getAuth, logout } from '../state/auth.js';
import { navigate, refresh as refreshRouter } from '../lib/router.js';

export default function Profile(root) {
  let cancelled = false;
  const cached = getAuth().user;

  if (cached) paint(cached);
  else root.innerHTML = toHTML(Spinner());

  api
    .get('/auth/me')
    .then(({ data }) => {
      if (!cancelled) paint(data.user);
    })
    .catch(() => {});

  function paint(user) {
    const rows = [
      { icon: 'Mail', label: 'Email', value: user.email },
      { icon: 'Phone', label: 'Phone', value: user.phone || 'Not provided' },
      { icon: 'ShieldCheck', label: 'Account type', value: user.role, capitalize: true },
      { icon: 'CalendarDays', label: 'Member since', value: formatDate(user.created_at) },
    ];

    root.innerHTML = toHTML(html`
      <div class="mx-auto max-w-2xl">
        ${PageHeader({ title: 'Profile', subtitle: 'Your RepairHub account details.' })}

        <div class="card p-6 sm:p-8">
          <div class="flex items-center gap-4">
            ${Avatar({ name: user.name, className: 'h-20 w-20 text-2xl' })}
            <div class="min-w-0">
              <h2 class="truncate text-xl font-bold text-slate-900">${user.name}</h2>
              <p class="text-sm capitalize text-slate-500">${user.role}</p>
            </div>
          </div>

          <dl class="mt-6 divide-y divide-slate-100 border-t border-slate-100">
            ${rows.map(
              (r) => html`
                <div class="flex items-center gap-3 py-4">
                  ${icon(r.icon, 'h-5 w-5 shrink-0 text-slate-400')}
                  <dt class="w-32 shrink-0 text-sm text-slate-500">${r.label}</dt>
                  <dd
                    class="min-w-0 flex-1 break-words text-sm font-medium text-slate-900 ${r.capitalize
                      ? 'capitalize'
                      : ''}"
                  >
                    ${r.value}
                  </dd>
                </div>
              `
            )}
          </dl>

          <!-- The API exposes no update endpoint for the base account record, so
               editing lives where it exists: the technician service profile. -->
          <div class="mt-6 flex flex-wrap gap-3">
            ${user.role === 'technician' &&
            html`<a href="/tech/profile" class="btn-primary"
              >${icon('UserCog', 'h-4 w-4')} Edit service profile</a
            >`}
            <button data-logout class="btn-secondary">
              ${icon('LogOut', 'h-4 w-4')} Log out
            </button>
          </div>
        </div>
      </div>
    `);

    root.querySelector('[data-logout]').addEventListener('click', () => {
      logout();
      navigate('/');
      refreshRouter();
    });
  }

  return () => {
    cancelled = true;
  };
}
