const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

exports.report = functions.https.onRequest(async (req, res) => {
  // POST create new report
  let { method } = req;
  if (method === 'POST') {
    let { body } = req;
    let data = JSON.parse(body);
    if (data) {
      const { deviceId, text } = data;
      if (deviceId && text) {
        await admin
          .database()
          .ref('/devices/' + deviceId + '/reports')
          .push({ text });

        res.status(200).send('Report received');
      }
    } else {
      res.status(422).send('Invalid data');
    }
  } else if (method === 'GET') {
    let { query } = req;
    let { userId } = query;
    if (userId) {
      let deviceObjects = await admin
        .database()
        .ref('/devices')
        .orderByChild('registeredUser')
        .equalTo(userId)
        .once('value', snapshot => snapshot.val());

      let payload = [];
      snapshotToArray(deviceObjects)
        .map(device => device.reports)
        .forEach(reports => {
          if (reports !== undefined) {
            Object.values(reports).forEach(report => {
              payload.push(report.text);
            });
          }
        });

      res.status(200).send(payload);
    } else {
      res.status(422).send('Invalid payload');
    }
  }
});

const snapshotToArray = snapshot => {
  let returnArr = [];

  snapshot.forEach(childSnapshot => {
    let item = childSnapshot.val();
    item.key = childSnapshot.key;
    returnArr.push(item);
  });

  return returnArr;
};

exports.register = functions.https.onRequest(async (req, res) => {
  // check if this is a POST request
  if (req.method !== 'POST') {
    res.send(405, 'HTTP Method ' + req.method + ' not allowed');
  }

  let data = undefined;
  if (req && req.body) {
    data = JSON.parse(req.body);
  }

  const { deviceId, userId } = data;

  // check for valid data in request payload
  if (data && deviceId && userId) {
    await admin
      .database()
      .ref('/devices/' + deviceId)
      .update({ registeredUser: userId });

    res.status(200).send('Device registered');
  } else {
    console.log(req.body.text);
    res.status(422).send('Invalid payload');
  }
});

exports.notification = functions.database
  .ref('/devices/{deviceId}/reports/{reportId}')
  .onWrite(async (change, context) => {
    const report = change.after.val();
    const { text } = report;

    let { deviceId } = context.params;
    let userId = await admin
      .database()
      .ref(`/devices/${deviceId}/registeredUser`)
      .once('value', snapshot => snapshot.val());

    let token = await admin
      .database()
      .ref(`/users/${userId.val()}/token`)
      .once('value', snapshot => snapshot.val());

    let payload = {
      notification: {
        title: 'You have a new report!',
        body: text
      }
    };

    return admin.messaging().sendToDevice(token.val(), payload);
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
