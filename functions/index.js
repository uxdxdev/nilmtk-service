const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

const validateDeviceSecret = (req, res) => {
  console.log('Check if request is authorized');
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer ')
  ) {
    console.error(
      'No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a "__session" cookie.'
    );
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken = undefined;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  }
  if (idToken && idToken === functions.config().device.secret) {
    return;
  } else {
    console.error('Error while verifying device secret:');
    res.status(403).send('Unauthorized');
  }
};

const validateFirebaseIdToken = (req, res) => {
  console.log('Check if request is authorized with Firebase ID token');
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer ')
  ) {
    console.error(
      'No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a "__session" cookie.'
    );
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  }
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedIdToken => {
      console.log('ID Token correctly decoded', decodedIdToken);
      req.user = decodedIdToken;
      return;
    })
    .catch(error => {
      console.error('Error while verifying Firebase ID token:', error);
      res.status(403).send('Unauthorized');
    });
};

exports.report = functions.https.onRequest(async (req, res) => {
  // POST create new report
  let { method } = req;
  if (method === 'POST') {
    // validate device secret because devices will only POST to /report
    validateDeviceSecret(req, res);
    let { body: data } = req;
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
    // GET fetch reports
  } else if (method === 'GET') {
    validateFirebaseIdToken(req, res);
    let { query } = req;
    let { userId } = query;
    if (userId) {
      let deviceObjects = await fetchDevicesByUserId(userId);

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

      payload = payload.slice(-5);
      res.status(200).send(payload);
    } else {
      res.status(422).send('Invalid payload');
    }
  } else {
    res.status(422).send('Invalid request');
  }
});

const fetchDevicesByUserId = userId => {
  return admin
    .database()
    .ref('/devices')
    .orderByChild('registeredUser')
    .equalTo(userId)
    .once('value', snapshot => snapshot.val());
};

const snapshotToArray = snapshot => {
  let returnArr = [];

  snapshot.forEach(childSnapshot => {
    let item = childSnapshot.val();
    item.key = childSnapshot.key;
    returnArr.push(item);
  });

  return returnArr;
};

exports.device = functions.https.onRequest(async (req, res) => {
  validateFirebaseIdToken(req, res);

  // POST register new device
  let { method } = req;
  if (method === 'POST') {
    let { body } = req;
    let data = JSON.parse(body);
    if (data) {
      const { deviceId, userId } = data;
      if (deviceId && userId) {
        await admin
          .database()
          .ref('/devices/' + deviceId)
          .update({ registeredUser: userId });

        res.status(200).send('Device registered');
      } else {
        res.status(422).send('Invalid payload');
      }
    } else {
      res.status(422).send('Invalid payload');
    }
    // GET fetch registered devices
  } else if (method === 'GET') {
    let { query } = req;
    let { userId } = query;
    if (userId) {
      let deviceObjects = await fetchDevicesByUserId(userId);

      let deviceObjectsArray = snapshotToArray(deviceObjects);
      let payload = [];
      deviceObjectsArray.forEach(entry => payload.push(entry.key));
      res.status(200).send(payload);
    } else {
      res.status(422).send('Invalid payload');
    }
  } else {
    res.status(422).send('Invalid request');
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
      data: {
        title: 'Consumo',
        body: text,
        icon: './favicon.ico',
        link: 'https://nilmtk-service.firebaseapp.com/dashboard'
      }
    };

    return admin.messaging().sendToDevice(token.val(), payload);
  });

exports.account = functions.auth.user().onCreate(event => {
  const { uid, providerData } = event;
  const email = providerData[0].email;

  return admin
    .database()
    .ref('/users/' + uid)
    .set({ email, uid });
});
