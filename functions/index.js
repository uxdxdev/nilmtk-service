const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

const checkForBearerToken = (req, res) => {
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
};

const getBearerToken = req => {
  let token = undefined;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    token = req.headers.authorization.split('Bearer ')[1];
  }
  return token;
};

const validateDeviceSecret = (req, res) => {
  checkForBearerToken(req, res);
  let token = getBearerToken(req);
  if (token && token === functions.config().device.secret) {
    return;
  } else {
    console.error('Error while verifying device secret:');
    res.status(403).send('Unauthorized');
  }
};

const validateFirebaseIdToken = (req, res) => {
  checkForBearerToken(req, res);
  let token = getBearerToken(req);
  admin
    .auth()
    .verifyIdToken(token)
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
      const { deviceId, text, reportType, applianceId } = data;
      if (deviceId && text) {
        if (applianceId) {
          const appliancesRef = await admin
            .database()
            .ref('/devices/' + deviceId + '/appliances');

          const applianceSnapshot = await appliancesRef
            .orderByChild('id')
            .equalTo(applianceId)
            .once('value');

          if (!applianceSnapshot.exists()) {
            appliancesRef.push({ id: applianceId });
          }
        }

        await admin
          .database()
          .ref('/devices/' + deviceId + '/reports')
          .push({ text, reportType });

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
        .map(device => {
          return { reports: device.reports, name: device.deviceName };
        })
        .forEach(result => {
          const { name } = result;
          if (result.reports !== undefined) {
            Object.values(result.reports).forEach(report => {
              payload.push({
                reportType: report.reportType,
                text: `${name}: ${report.text}`
              });
            });
          }
        });

      // only return the latest n reports
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

const IsJsonString = str => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

exports.device = functions.https.onRequest(async (req, res) => {
  let { method } = req;
  if (method === 'POST') {
    // POST register new device
    validateFirebaseIdToken(req, res);

    let { body } = req;
    let data = JSON.parse(body);
    if (data) {
      const { deviceName, deviceId, userId } = data;
      if (deviceId && userId) {
        await admin
          .database()
          .ref('/devices/' + deviceId)
          .update({ deviceName: deviceName || '', registeredUser: userId });

        res.status(200).send('Device registered');
      } else {
        res.status(422).send('Invalid payload');
      }
    } else {
      res.status(422).send('Invalid data payload');
    }
  } else if (method === 'GET') {
    // GET fetch registered devices
    validateFirebaseIdToken(req, res);

    let { query } = req;
    let { userId } = query;
    if (userId) {
      let deviceObjects = await fetchDevicesByUserId(userId);
      let deviceObjectsArray = snapshotToArray(deviceObjects);
      let payload = [];
      deviceObjectsArray.forEach(device => payload.push(device));
      res.status(200).send(payload);
    } else {
      res.status(422).send('Invalid payload');
    }
  } else if (method === 'PUT') {
    // PUT create new appliance record or update existing record
    let { body: data } = req;
    if (data) {
      // parse only if JSON string
      let dataParsed = null;
      if (IsJsonString(data)) {
        dataParsed = JSON.parse(data);
      } else {
        dataParsed = data;
      }
      const { origin, deviceId, applianceId, name } = dataParsed;

      // validate request
      if (origin === 'device') {
        validateDeviceSecret(req, res);
      } else if (origin === 'app') {
        validateFirebaseIdToken(req, res);
      }

      if (deviceId && applianceId) {
        await admin
          .database()
          .ref('/devices/' + deviceId + '/appliances')
          .orderByChild('id')
          .equalTo(applianceId)
          .once('value', snapshot => {
            if (snapshot.hasChildren()) {
              return snapshot.forEach(child => {
                child.ref.update({ id: applianceId, name });
              });
            } else {
              return snapshot.ref.push({ id: applianceId, name });
            }
          });
        res.status(200).send('Appliance info updated');
      } else {
        res.status(422).send('Invalid payload');
      }
    } else {
      res.status(422).send('Invalid data payload');
    }
  } else {
    res.status(422).send('Invalid request');
  }
});

exports.notification = functions.database
  .ref('/devices/{deviceId}/reports/{reportId}')
  .onWrite(async (change, context) => {
    const report = change.after.val();
    const { text, reportType } = report;
    let { deviceId } = context.params;
    let userId = await admin
      .database()
      .ref(`/devices/${deviceId}/registeredUser`)
      .once('value', snapshot => snapshot.val());

    let deviceNameSnapshot = await admin
      .database()
      .ref(`/devices/${deviceId}/deviceName`)
      .once('value', snapshot => snapshot.val());

    let tokensSnapshot = await admin
      .database()
      .ref(`/users/${userId.val()}/tokens`)
      .once('value', snapshot => snapshot.val());

    let tokens = snapshotToArray(tokensSnapshot);

    let deviceName = deviceNameSnapshot.val();
    let payload = {
      data: {
        title: 'Ecopush',
        body: `${deviceName}: ${text}`,
        reportType,
        icon: './favicon.ico',
        link: 'https://nilmtk-service.firebaseapp.com'
      }
    };

    return admin.messaging().sendToDevice(tokens, payload);
  });

exports.account = functions.auth.user().onCreate(event => {
  const { uid, providerData } = event;
  const email = providerData[0].email;

  return admin
    .database()
    .ref('/users/' + uid)
    .set({ email, uid });
});
