/**
 * Notifications — the NotificationContext replacement.
 *
 * Holds the list, keeps a Socket.IO connection open for the signed-in user, and
 * exposes the same operations the bell and the Notifications page used. The
 * socket is torn down and rebuilt whenever the session changes.
 */
import { io } from 'socket.io-client';
import { createStore } from '../lib/store.js';
import api, { API_BASE } from '../api/client.js';
import { authStore } from './auth.js';
import toast from '../lib/toast.js';

export const notificationStore = createStore({ notifications: [] });

export function subscribeNotifications(fn, options) {
  return notificationStore.subscribe(fn, options);
}

export function getNotifications() {
  return notificationStore.get().notifications;
}

export function unreadCount() {
  return notificationStore.get().notifications.filter((n) => !n.is_read).length;
}

export async function refresh() {
  if (!localStorage.getItem('rh_token')) return;
  try {
    const { data } = await api.get('/notifications');
    notificationStore.set({ notifications: data.notifications });
  } catch {
    /* non-fatal — the bell just stays at its last count */
  }
}

export async function markRead(id) {
  notificationStore.set((s) => ({
    notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
  }));
  try {
    await api.patch(`/notifications/${id}/read`);
  } catch {
    /* non-fatal */
  }
}

export async function markAllRead() {
  notificationStore.set((s) => ({
    notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
  }));
  try {
    await api.patch('/notifications/read-all');
  } catch {
    /* non-fatal */
  }
}

let socket = null;
let lastToken = null;

/**
 * Follow the session: connect on login, disconnect on logout. The API pushes
 * every notification into the user's private room, so new quotes, status
 * changes and payments land without polling.
 */
export function initNotifications() {
  authStore.subscribe(({ token, user }) => {
    if (token === lastToken) return;
    lastToken = token;

    if (socket) {
      socket.disconnect();
      socket = null;
    }

    if (!token || !user) {
      notificationStore.set({ notifications: [] });
      return;
    }

    refresh();
    socket = io(API_BASE, { auth: { token } });
    socket.on('notification', (n) => {
      notificationStore.set((s) => ({ notifications: [n, ...s.notifications] }));
      toast(`${n.title}\n${n.body || ''}`.trim(), { icon: '🔔', duration: 5000 });
    });
  }, { immediate: true });
}
