/* global importScripts, firebase */
// Background push handler. Only does anything once the VITE_FIREBASE_* values
// below are filled in — src/lib/push.js skips registration entirely when the
// app has no Firebase config, so an unconfigured deployment never loads this.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
});

firebase.messaging().onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'RepairHub', {
    body: body || '',
    icon: '/logo-4.png',
  });
});
