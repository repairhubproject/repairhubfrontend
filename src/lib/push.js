// Firebase Cloud Messaging (web push) registration.
// Grabs an FCM device token for this browser and registers it with the backend
// (POST /api/notifications/devices), which then delivers pushes to every
// registered token for the user. If the VITE_FIREBASE_* env vars are empty this
// is a silent no-op, so local dev and demos keep working without a Firebase project.
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import api from '../api/client.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let registered = false;

/** Call once the user has a session. Safe to call repeatedly. */
export async function registerPush() {
  if (!firebaseConfig.apiKey || !VAPID_KEY) return; // not configured → skip quietly
  if (registered) return;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (!(await isSupported().catch(() => false))) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });
  if (!token) return;

  await api.post('/notifications/devices', { token, platform: 'web' });
  registered = true;

  // Foreground toasts (tab open) are owned by NotificationContext's Socket.IO
  // listener — it works with or without FCM configured. FCM's job here is the
  // background case (tab closed), handled by public/firebase-messaging-sw.js.
}
