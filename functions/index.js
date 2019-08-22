const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
// POST
exports.report = functions.https.onRequest(async (req, res) => {
  // check if this is a POST request
  if (req.method !== 'POST') {
    res.send(405, 'HTTP Method ' + req.method + ' not allowed');
  }

  let data = undefined;
  if (req && req.body) {
    data = JSON.parse(req.body);
  }

  // check for valid data in request payload
  if (data !== undefined && data.deviceId && data.text) {
    console.log('Payload data correct');
    // Grab the text parameter.
    const deviceId = data.deviceId;
    const text = data.text;

    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    const snapshot = await admin
      .database()
      .ref('/reports/' + deviceId)
      .push({ text });

    res.send(snapshot.ref.toString());
  } else {
    console.log(req.body.text);
    res.send(422, 'Payload data missing');
  }
});

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.notification = functions.database
  .ref('/reports/{deviceId}/{pushId}/text')
  .onCreate((snapshot, context) => {
    // Grab the current value of what was written to the Realtime Database.
    const text = snapshot.val();

    // send push notification to user

    // console.log('Uppercasing', context.params.pushId, text);
    const uppercase = text.toUpperCase();
    // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // writing to the Firebase Realtime Database.
    // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    return snapshot.ref.parent.child('uppercase').set(uppercase);
  });

// add new users to the database
exports.account = functions.auth.user().onCreate(event => {
  const { uid, providerData } = event;
  const email = providerData[0].email;

  return admin
    .database()
    .ref('/users/' + uid)
    .set({ email, uid });
});
