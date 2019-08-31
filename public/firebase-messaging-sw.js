/* eslint-disable no-undef */
importScripts('/__/firebase/6.4.0/firebase-app.js');
importScripts('/__/firebase/6.4.0/firebase-messaging.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

// messaging.setBackgroundMessageHandler(payload => {
//   const promiseChain = clients
//     .matchAll({
//       type: 'window',
//       includeUncontrolled: true
//     })
//     .then(windowClients => {
//       for (let i = 0; i < windowClients.length; i++) {
//         const windowClient = windowClients[i];
//         windowClient.postMessage(payload);
//       }
//     })
//     .then(() => {
//       return registration.showNotification('my notification title');
//     });
//   return promiseChain;
// });

// eslint-disable-next-line no-restricted-globals
self.addEventListener('notificationclick', event => {
  if (event.action) {
    clients.openWindow(event.action);
  }
  event.notification.close();
});
