import React from 'react';
import { messaging } from '../../firebaseUtils';

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

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.textInputRef = React.createRef();
    this.textInputErrorMessageRef = React.createRef();

    this.registerDeviceInputRef = React.createRef();
    this.registerDeviceInputErrorMessageRef = React.createRef();

    this.state = {
      messages: [],
      reports: [],
      clientToken: undefined,
      isSignedIn: false,
      uid: undefined,
      idToken: undefined
    };
  }

  componentDidMount() {
    ui.start('#firebaseui-auth-container', uiConfig);

    // event listener for push notifications
    navigator.serviceWorker.addEventListener('message', payload => {
      const { data: payloadData } = payload;
      const firebaseMessageData = payloadData['firebase-messaging-msg-data'];
      const { data } = firebaseMessageData;

      const { title, body, icon, link } = data;

      // display in UI
      let { messages } = this.state;
      messages.push({ title, body, icon, link });
      this.setState({ messages });

      // show notification when page is in focus
      const notificationOptions = {
        body,
        icon,
        data: link
      };

      this.setState({ notificationOptions });

      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, notificationOptions);
      });
    });

    // eslint-disable-next-line no-undef
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      // set the uid of the user in component state
      if (user) {
        let { uid } = user;
        this.setState({ uid });
      }

      // set the user signed in status
      this.setState({ isSignedIn: !!user });

      if (this.state.isSignedIn && this.state.clientToken === undefined) {
        this.initFcm();
      }

      if (this.state.isSignedIn && this.state.idToken === undefined) {
        this.initIdToken();
      }
    });
  }

  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  initFcm = () => {
    messaging
      .requestPermission()
      .then(async () => {
        const token = await messaging.getToken();
        this.setState({ clientToken: token });
        this.saveTokenToDB(this.state.uid, token);
      })
      .catch(err => {
        console.log('Unable to get permission to notify.', err);
      });
  };

  initIdToken = () => {
    // eslint-disable-next-line no-undef
    firebase
      .auth()
      .currentUser.getIdToken(/* forceRefresh */ true)
      .then(idToken => {
        // Send token to your backend via HTTPS
        this.setState({ idToken });
        this.fetchDevices();
        this.fetchReports();
      })
      .catch(error => {
        console.log(error);
      });
  };

  saveTokenToDB = (uid, token) => {
    // eslint-disable-next-line no-undef
    firebase
      .database()
      .ref('/users/' + uid)
      .update({ token });
  };

  fetchGetRequest = url => {
    const { idToken } = this.state;
    if (idToken) {
      return fetch(url, {
        headers: new Headers({
          Authorization: 'Bearer ' + idToken
        })
      })
        .then(response => {
          return response.json();
        })
        .catch(error => {
          console.log('fetchReports failed', error);
        });
    }
  };

  fetchReports = async () => {
    const { uid } = this.state;
    if (uid) {
      let reports = await this.fetchGetRequest(`/api/report?userId=${uid}`);
      this.setState({ reports });
    }
  };

  fetchDevices = async () => {
    const { uid } = this.state;
    if (uid) {
      let devices = await this.fetchGetRequest(`/api/device?userId=${uid}`);
      let deviceId = devices[0];
      this.setState({ devices, deviceId });
    }
  };

  registerDevice = async () => {
    const deviceIdInput = this.registerDeviceInputRef.current;
    if (!deviceIdInput.checkValidity()) {
      this.registerDeviceInputErrorMessageRef.current.innerHTML =
        deviceIdInput.validationMessage;
    } else {
      const { uid, idToken } = this.state;
      const deviceId = deviceIdInput.value;
      if (uid && idToken && deviceId) {
        await fetch(`/api/device`, {
          method: 'post',
          body: JSON.stringify({ deviceId, userId: uid }),
          headers: new Headers({
            Authorization: 'Bearer ' + idToken
          })
        })
          .then(() => {
            deviceIdInput.value = '';
            this.setState({ deviceId });
            this.fetchDevices();
          })
          .catch(error => console.log(error));
      }
    }
  };

  render() {
    const { messages, clientToken, reports, devices } = this.state;

    if (!this.state.isSignedIn) {
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
        <button onClick={this.fetchDevices}>Refresh</button>
        <ul>
          {devices &&
            devices.map((device, index) => <li key={index}>{device}</li>)}
        </ul>
        <input
          type="number"
          ref={this.registerDeviceInputRef}
          required
          placeholder="device id"
        />
        <button onClick={this.registerDevice}>Register</button>
        <p ref={this.registerDeviceInputErrorMessageRef} />

        <h4>Reports</h4>
        <button onClick={this.fetchReports}>Refresh</button>
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
  }
}

export default Dashboard;
