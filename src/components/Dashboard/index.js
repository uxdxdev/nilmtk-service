import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as firebaseUtils from '../../firebaseUtils';
import { useToast } from '@chakra-ui/core';

// eslint-disable-next-line no-undef
const ui = new firebaseui.auth.AuthUI(firebase.auth());

const uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      // return true;

      // login UI shows on the dashboard page when accessed so we don't want to
      // redirect away from this page when successful.
      return false;
    },
    uiShown: function() {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loader').style.display = 'none';
    }
  },
  // eslint-disable-next-line no-undef
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  // signInFlow: 'popup',
  // signInSuccessUrl: '/dashboard',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    // firebase.auth.GithubAuthProvider.PROVIDER_ID,
    // eslint-disable-next-line no-undef
    firebase.auth.EmailAuthProvider.PROVIDER_ID
    // firebase.auth.PhoneAuthProvider.PROVIDER_ID
  ]
  // Terms of service url.
  // tosUrl: '<your-tos-url>',
  // Privacy policy url.
  // privacyPolicyUrl: '<your-privacy-policy-url>'
};

const Dashboard = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);

  const [toastMessage, setToastMessage] = useState(undefined);
  const toast = useToast();

  useEffect(() => {
    if (toastMessage) {
      const { title, body } = toastMessage;

      toast({
        title,
        description: body,
        status: 'success',
        duration: 9000,
        isClosable: true
      });
    }
  }, [toastMessage, toast]);

  useEffect(() => {
    if (!isSignedIn) {
      console.log('show login');
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  }, [isSignedIn]);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const messageHandler = payload => {
      console.log('messageHandler', payload);
      const { data: payloadData } = payload;
      const firebaseMessageData = payloadData['firebase-messaging-msg-data'];
      const { data } = firebaseMessageData;

      const { title, body, icon, link } = data;
      const message = { title, body, icon, link };

      // display in UI
      setMessages(oldArray => [...oldArray, message]);

      // set toast message
      setToastMessage(message);

      // show notification when page is in focus
      const notificationOptions = {
        body,
        icon,
        data: link
      };

      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, notificationOptions);
      });
    };

    console.log('addEventListener message');
    navigator.serviceWorker.addEventListener('message', messageHandler);

    return () => {
      console.log('removeEventListener message');
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, []);

  const [clientToken, setClientToken] = useState(undefined);
  const [userId, setUid] = useState(undefined);

  useEffect(() => {
    const saveClientTokenToDB = (uid, token) => {
      // eslint-disable-next-line no-undef
      firebase
        .database()
        .ref('/users/' + uid)
        .update({ token });
    };

    const initFcm = () => {
      firebaseUtils.messaging
        .requestPermission()
        .then(async () => {
          const token = await firebaseUtils.messaging.getToken();
          console.log('client token', token);
          setClientToken(token);
          saveClientTokenToDB(userId, token);
        })
        .catch(err => {
          console.log('Unable to get permission to notify.', err);
        });
    };

    if (isSignedIn && clientToken === undefined) {
      console.log('fetching client token');
      initFcm();
    }
  }, [isSignedIn, clientToken, userId]);

  const [idToken, setIdToken] = useState(undefined);

  useEffect(() => {
    const initIdToken = () => {
      // eslint-disable-next-line no-undef
      firebase
        .auth()
        .currentUser.getIdToken(/* forceRefresh */ true)
        .then(idToken => {
          // Send token to your backend via HTTPS
          console.log('idToken', idToken);
          setIdToken(idToken);
        })
        .catch(error => {
          console.log(error);
        });
    };

    if (isSignedIn && idToken === undefined) {
      console.log('fetching id token');
      initIdToken();
    }
  }, [idToken, isSignedIn]);

  const [reports, setReports] = useState([]);
  const [devices, setDevices] = useState(undefined);

  const fetchGetRequest = useCallback((url, token) => {
    if (url && token) {
      return fetch(url, {
        headers: new Headers({
          Authorization: 'Bearer ' + token
        })
      })
        .then(response => {
          return response.json();
        })
        .catch(error => {
          console.log('fetchGetRequest failed', error);
        });
    } else {
      console.log('fetchGetRequest error', url, token);
    }
  }, []);

  const fetchReports = useCallback(
    async (uid, token) => {
      if (uid && token) {
        let userReports = await fetchGetRequest(
          `/api/report?userId=${uid}`,
          token
        );
        setReports(userReports);
      } else {
        console.log('fetchReports error', uid, token);
      }
    },
    [fetchGetRequest]
  );

  useEffect(() => {
    fetchReports(userId, idToken);
  }, [idToken, userId, fetchReports]);

  const fetchDevices = useCallback(
    async (uid, token) => {
      if (uid && token) {
        let userDevices = await fetchGetRequest(
          `/api/device?userId=${uid}`,
          token
        );
        setDevices(userDevices);
      } else {
        console.log('fetchDevices error', uid, token);
      }
    },
    [fetchGetRequest]
  );

  useEffect(() => {
    fetchDevices(userId, idToken);
  }, [idToken, userId, fetchDevices]);

  useEffect(() => {
    console.log('registerAuthObserver');
    // eslint-disable-next-line no-undef
    const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      console.log('auth state changed');
      // set the uid of the user in component state
      if (user) {
        let { uid } = user;
        setUid(uid);
      }

      // set the user signed in status
      setIsSignedIn(!!user);
    });

    return () => {
      console.info('unregisterAuthObserver');
      unregisterAuthObserver();
    };
  }, []);

  const registerDeviceInputRef = useRef(null);
  const registerDeviceInputErrorMessageRef = useRef(null);

  const registerDevice = async (uid, token) => {
    const deviceIdInput = registerDeviceInputRef.current;
    if (!deviceIdInput.checkValidity()) {
      registerDeviceInputErrorMessageRef.current.innerHTML =
        deviceIdInput.validationMessage;
    } else {
      const id = deviceIdInput.value;
      if (uid && token && id) {
        await fetch(`/api/device`, {
          method: 'post',
          body: JSON.stringify({ deviceId: id, userId: uid }),
          headers: new Headers({
            Authorization: 'Bearer ' + token
          })
        })
          .then(() => {
            deviceIdInput.value = '';
          })
          .catch(error => console.log(error));
      } else {
        console.log('registerDevice error', uid, token, id);
      }
    }
  };

  if (!isSignedIn) {
    return (
      <div>
        <h1>My App</h1>
        <p>Please sign-in:</p>
        <div id="firebaseui-auth-container" />
        <div id="loader">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <p>This is the dashboard page.</p>
      <button
        onClick={() => {
          // eslint-disable-next-line no-undef
          firebase.auth().signOut();
          // redirect to landing page
          window.location.href = '/';
        }}
      >
        Sign-out
      </button>
      <h4>Service worker token</h4>
      <p>{clientToken}</p>
      <h4>Registered devices</h4>
      <button onClick={() => fetchDevices(userId, idToken)}>Refresh</button>
      <ul>
        {devices &&
          devices.map((device, index) => <li key={index}>{device}</li>)}
      </ul>
      <input
        type="number"
        ref={registerDeviceInputRef}
        required
        placeholder="device id"
      />
      <button onClick={() => registerDevice(userId, idToken)}>Register</button>
      <p ref={registerDeviceInputErrorMessageRef} />

      <h4>Reports</h4>
      <button onClick={() => fetchReports(userId, idToken)}>Refresh</button>
      <ul>
        {reports &&
          reports.map((report, index) => <li key={index}>{report}</li>)}
      </ul>
      <h4>Push notifications</h4>
      <p>Send report to receive notification</p>
      <ul>
        {messages &&
          messages.map((message, index) => (
            <li key={index}>
              {message.title} {message.body}
            </li>
          ))}
      </ul>
    </>
  );
};

export default Dashboard;
