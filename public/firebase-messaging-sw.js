/* eslint-disable no-undef */
importScripts('/__/firebase/6.4.0/firebase-app.js');
importScripts('/__/firebase/6.4.0/firebase-messaging.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(payload => {
  const { data } = payload;
  const { title, body, icon, link } = data;
  const notificationOptions = {
    body,
    icon,
    data: link
  };

  // eslint-disable-next-line no-restricted-globals
  return self.registration.showNotification(title, notificationOptions);
});

// eslint-disable-next-line no-restricted-globals
self.addEventListener('notificationclick', event => {
  event.notification.close();
  // eslint-disable-next-line no-restricted-globals
  event.waitUntil(self.clients.openWindow(event.notification.data));
});
