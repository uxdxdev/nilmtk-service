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

      // temp
      notificationOptions: undefined
    };
  }

  componentDidMount() {
    ui.start('#firebaseui-auth-container', uiConfig);

    // event listener for push notifications
    navigator.serviceWorker.addEventListener('message', payload => {
      console.log('PWA message listener', payload);
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
        data: link,
        click_action: link
      };

      this.setState({ notificationOptions });

      navigator.serviceWorker.ready.then(registration => {
        console.log('registration', registration);
        registration.showNotification(title, notificationOptions);
      });
    });

    // eslint-disable-next-line no-undef
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      // set the uid of the user in component state
      if (user && user.uid) {
        let { uid } = user;
        this.setState({ uid });
        this.fetchDevices();
        this.fetchReports();
      }

      // set the user signed in status
      this.setState({ isSignedIn: !!user });

      if (this.state.isSignedIn && this.state.clientToken === undefined) {
        this.initFcm();
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
        this.updateUserDetailsInDB();
      })
      .catch(err => {
        console.log('Unable to get permission to notify.', err);
      });
  };

  updateUserDetailsInDB = () => {
    // update db with user details
    const { uid, clientToken } = this.state;
    if (uid !== undefined && clientToken !== undefined) {
      // eslint-disable-next-line no-undef
      firebase
        .database()
        .ref('/users/' + uid)
        .update({ token: clientToken });
    }
  };

  fetchReports = async () => {
    const { uid } = this.state;
    if (uid) {
      let reports = await fetch(`/api/report?userId=${uid}`)
        .then(response => {
          return response.json();
        })
        .catch(error => {
          console.log(error);
        });

      this.setState({ reports });
    }
  };

  fetchDevices = async () => {
    const { uid } = this.state;
    if (uid) {
      let devices = await fetch(`/api/device?userId=${uid}`)
        .then(response => {
          return response.json();
        })
        .catch(error => {
          console.log(error);
        });

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
      const { uid } = this.state;
      const deviceId = deviceIdInput.value;
      if (uid && deviceId) {
        await fetch(`/api/device`, {
          method: 'post',
          body: JSON.stringify({ deviceId, userId: uid })
        })
          .then(() => {
            deviceIdInput.value = '';
            this.setState({ deviceId });
            this.fetchDevices();
            this.fetchReports();
          })
          .catch(error => console.log(error));
      }
    }
  };

  render() {
    const {
      messages,
      clientToken,
      reports,
      devices,
      notificationOptions
    } = this.state;

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
        <p>{JSON.stringify(notificationOptions)}</p>
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
