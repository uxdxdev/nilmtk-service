// firebase imported in index.html scripts

const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./firebase-messaging-sw.js')
      .then(function(registration) {
        console.log('Registration successful, scope is:', registration.scope);
      })
      .catch(function(err) {
        console.log('Service worker registration failed, error:', err);
      });
  }
};

// eslint-disable-next-line no-undef
const messaging = firebase.messaging();

messaging.usePublicVapidKey(
  // Project Settings => Cloud Messaging => Web Push certificates
  'BDHAwrtP3joErJkNBSgVHkDkVZxFS_iAYssjc4Davg1WgJhscXW6mDbdQDzapaOWR2A6w3Rx078ZHKi3e4k34X0'
);

export { registerServiceWorker, messaging };
