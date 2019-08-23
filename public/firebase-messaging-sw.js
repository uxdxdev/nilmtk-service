/* eslint-disable no-undef */
// importScripts('https://www.gstatic.com/firebasejs/6.4.0/firebase-app.js');
// importScripts('https://www.gstatic.com/firebasejs/6.4.0/firebase-messaging.js');

importScripts('/__/firebase/6.4.0/firebase-app.js');
importScripts('/__/firebase/6.4.0/firebase-messaging.js');

firebase.initializeApp({
  // Project Settings => Add Firebase to your web app
  messagingSenderId: '1062407524656'
});

const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(function(payload) {
  const promiseChain = clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        windowClient.postMessage(payload);
      }
    })
    .then(() => {
      return registration.showNotification('my notification title');
    });
  return promiseChain;
});
// eslint-disable-next-line no-restricted-globals
self.addEventListener('notificationclick', function(event) {
  // do what you want
  // ...
});
