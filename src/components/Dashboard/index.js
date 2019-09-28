import React, { useEffect, useState } from 'react';
import * as firebaseUtils from '../../utils/firebaseUtils';
import { useToast, Box } from '@chakra-ui/core';
import Reports from './components/Reports';
import Device from './components/Device';
import Navigation from '../Navigation';

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
    {
      // eslint-disable-next-line no-undef
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
      requireDisplayName: false
    }
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
      const { title, text, reportType } = toastMessage;
      toast({
        title,
        description: text,
        status: reportType,
        duration: 9000,
        isClosable: true
      });
    }
  }, [toastMessage, toast]);

  useEffect(() => {
    if (!isSignedIn) {
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  }, [isSignedIn]);

  useEffect(() => {
    const messageHandler = payload => {
      const { data: payloadData } = payload;
      const firebaseMessageData = payloadData['firebase-messaging-msg-data'];
      const { data } = firebaseMessageData;

      const { title, reportType, body, icon, link } = data;
      const message = {
        title,
        reportType,
        text: body,
        icon,
        link
      };

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

    navigator.serviceWorker.addEventListener('message', messageHandler);

    return () => {
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
        .ref('/users/' + uid + '/tokens')
        .push({ token });
    };

    const initFcm = () => {
      firebaseUtils.messaging
        .requestPermission()
        .then(async () => {
          const token = await firebaseUtils.messaging.getToken();

          setClientToken(token);
          saveClientTokenToDB(userId, token);
        })
        .catch(err => {});
    };

    if (isSignedIn && clientToken === undefined) {
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

          setIdToken(idToken);
        })
        .catch(error => {});
    };

    if (isSignedIn && idToken === undefined) {
      initIdToken();
    }
  }, [idToken, isSignedIn]);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
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

  if (!isSignedIn) {
    return (
      <Box p={4}>
        <Navigation isSignedIn={isSignedIn} />
        <div id="firebaseui-auth-container" />
        <div id="loader">Loading...</div>
      </Box>
    );
  }

  return (
    <>
      <Navigation isSignedIn={isSignedIn} />
      {userId && idToken && (
        <>
          <Reports userId={userId} idToken={idToken} newReport={toastMessage} />
          <Device userId={userId} idToken={idToken} />
        </>
      )}
    </>
  );
};

export default Dashboard;
