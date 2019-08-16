// eslint-disable-next-line no-undef
const messaging = firebase.messaging();
messaging.usePublicVapidKey(
  // Project Settings => Cloud Messaging => Web Push certificates
  'BDHAwrtP3joErJkNBSgVHkDkVZxFS_iAYssjc4Davg1WgJhscXW6mDbdQDzapaOWR2A6w3Rx078ZHKi3e4k34X0'
);
export { messaging };
