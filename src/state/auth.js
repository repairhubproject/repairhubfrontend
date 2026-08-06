/**
 * Session state — the AuthContext replacement.
 *
 * The store holds { user, token, loading } exactly as the context did, and the
 * shell subscribes to it so a login or logout swaps the chrome without a page
 * reload.
 */
import { createStore } from '../lib/store.js';
import api from '../api/client.js';

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('rh_user')) || null;
  } catch {
    return null;
  }
}

const token = localStorage.getItem('rh_token');

export const authStore = createStore({
  user: readUser(),
  token,
  loading: Boolean(token),
});

export function getAuth() {
  return authStore.get();
}

export function subscribeAuth(fn, options) {
  return authStore.subscribe(fn, options);
}

function applySession(data) {
  localStorage.setItem('rh_token', data.token);
  localStorage.setItem('rh_user', JSON.stringify(data.user));
  authStore.set({ token: data.token, user: data.user, loading: false });
  registerPushIfConfigured();
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  applySession(data);
  return data.user;
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  applySession(data);
  return data.user;
}

export function logout() {
  localStorage.removeItem('rh_token');
  localStorage.removeItem('rh_user');
  authStore.set({ token: null, user: null, loading: false });
}

/**
 * Register this browser for push whenever we have a session (login or boot).
 * Imported lazily and only when FCM is actually configured — the Firebase SDK
 * is ~350kB, and most deployments run without it on Socket.IO alone.
 */
function registerPushIfConfigured() {
  if (!authStore.get().token) return;
  if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_VAPID_KEY) return;
  import('../lib/push.js')
    .then(({ registerPush }) => registerPush())
    .catch(() => {});
}

/**
 * Re-validate the stored session on boot so a revoked/expired token doesn't
 * leave the UI showing a logged-in shell it can't fetch data for.
 * Resolves once the answer is known, so the first render isn't a guess.
 */
export async function initAuth() {
  if (!authStore.get().token) return;
  try {
    const { data } = await api.get('/auth/me');
    localStorage.setItem('rh_user', JSON.stringify(data.user));
    authStore.set({ user: data.user });
  } catch {
    /* the 401 interceptor already clears a dead token */
  } finally {
    authStore.set({ loading: false });
  }
  registerPushIfConfigured();
}
