import { html, toHTML, on } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { EmptyState, PageHeader } from '../components/ui.js';
import { timeAgo } from '../lib/format.js';
import {
  getNotifications,
  markAllRead,
  markRead,
  subscribeNotifications,
  unreadCount,
} from '../state/notifications.js';

export default function Notifications(root) {
  function paint() {
    const list = getNotifications();
    const unread = unreadCount();

    root.innerHTML = toHTML(html`
      <div class="mx-auto max-w-2xl">
        ${PageHeader({
          title: 'Notifications',
          subtitle: unread > 0 ? `${unread} unread` : 'You are all caught up.',
          action:
            unread > 0
              ? html`<button data-mark-all class="btn-secondary">
                  ${icon('CheckCheck', 'h-4 w-4')} Mark all read
                </button>`
              : '',
        })}
        ${list.length === 0
          ? EmptyState({
              iconName: 'BellRing',
              title: 'No notifications yet',
              hint: 'Quotes, booking updates, payments and reminders all show up here in real time.',
            })
          : html`
              <div class="card divide-y divide-slate-100">
                ${list.map(
                  (n) => html`
                    <button
                      type="button"
                      data-notification="${n.id}"
                      data-read="${n.is_read ? '1' : '0'}"
                      class="flex w-full gap-3 p-4 text-left transition hover:bg-slate-50 ${n.is_read
                        ? ''
                        : 'bg-brand-surface/60'}"
                    >
                      <span
                        class="mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read
                          ? 'bg-transparent'
                          : 'bg-brand-500'}"
                      ></span>
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-baseline justify-between gap-2">
                          <p
                            class="text-sm ${n.is_read
                              ? 'text-slate-700'
                              : 'font-semibold text-slate-900'}"
                          >
                            ${n.title}
                          </p>
                          <span class="text-xs text-slate-400">${timeAgo(n.created_at)}</span>
                        </div>
                        ${n.body && html`<p class="mt-0.5 text-sm text-slate-500">${n.body}</p>`}
                      </div>
                    </button>
                  `
                )}
              </div>
            `}
      </div>
    `);
  }

  // The mark-read calls update the store, which re-renders through here.
  const stop = subscribeNotifications(paint, { immediate: true });

  const offAll = on(root, 'click', '[data-mark-all]', () => markAllRead());
  const offOne = on(root, 'click', '[data-notification]', (_e, btn) => {
    if (btn.dataset.read === '1') return;
    markRead(Number(btn.dataset.notification));
  });

  return () => {
    stop();
    offAll();
    offOne();
  };
}
