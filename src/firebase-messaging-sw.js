importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js'
);

const firebaseConfig = {
  apiKey: '{FIREBASE_API_KEY}',
  authDomain: '{FIREBASE_AUTH_DOMAIN}',
  projectId: '{FIREBASE_PROJECT_ID}',
  storageBucket: '{FIREBASE_STORAGE_BUCKET}',
  messagingSenderId: '{FIREBASE_MESSAGING_SENDER_ID}',
  appId: '{FIREBASE_APP_ID}',
  measurementId: '{FIREBASE_MEASUREMENT_ID}'
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, click_action } = payload?.data || {};
  if (!title || !body) return;

  const options = {
    title,
    body,
    data: {
      click_action: click_action || ''
    }
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ includeUncontrolled: true, type: 'window' })
      .then((windowClients) => {
        const client = windowClients.find(
          (c) =>
            c.visibilityState === 'visible' &&
            c.url === event.notification.data.click_action &&
            'focus' in c
        );

        if (client) {
          client.focus();
        } else if (clients.openWindow) {
          clients.openWindow(event.notification.data.click_action);
        }
      })
  );
});
