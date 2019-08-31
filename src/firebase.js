// firebase imported in index.html scripts
// eslint-disable-next-line no-undef
const messaging = firebase.messaging();

messaging.usePublicVapidKey(
  // Project Settings => Cloud Messaging => Web Push certificates
  'BDHAwrtP3joErJkNBSgVHkDkVZxFS_iAYssjc4Davg1WgJhscXW6mDbdQDzapaOWR2A6w3Rx078ZHKi3e4k34X0'
);

if ('serviceWorker' in navigator) {
  // navigator.serviceWorker
  //   .register('./firebase-messaging-sw.js')
  //   .then(function(registration) {
  //     console.log('Registration successful, scope is:', registration.scope);
  //   })
  //   .catch(function(err) {
  //     console.log('Service worker registration failed, error:', err);
  //   });
  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );
    messaging.useServiceWorker(registration);

    messaging.onMessage(payload => {
      console.log('firebase.js', payload);
      const title = payload.notification.title;
      const options = {
        body: payload.notification.body,
        icon: payload.notification.icon,
        actions: [
          {
            action: payload.fcmOptions.link,
            title: 'Open Dashboard'
          }
        ]
      };

      registration.showNotification(title, options);
    });
  });
}

export { messaging };
