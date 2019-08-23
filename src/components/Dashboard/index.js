/* eslint-disable no-undef */
import React from 'react';
import { messaging } from '../../init-fcm';

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
      messages: undefined,
      reports: undefined,
      clientToken: undefined,
      isSignedIn: undefined,
      uid: undefined
    };
  }

  componentDidMount() {
    ui.start('#firebaseui-auth-container', uiConfig);

    // event listener for new push notifications
    navigator.serviceWorker.addEventListener('message', message => {
      const { data } = message;
      const messageObject = data['firebase-messaging-msg-data'];
      const { notification } = messageObject;
      const { messages } = this.state;
      messages.push(notification);
      this.setState({ messages });
    });

    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      // set the uid of the user in component state
      if (user && user.uid) {
        let { uid } = user;
        this.setState({ uid });
        // read reports for user from DB
        this.fetchReports();
      }

      // set the user signed in status
      this.setState({ isSignedIn: !!user });

      // only ask for permissions if we are signed in and we don't have the
      // client token
      if (this.state.isSignedIn && this.state.clientToken === undefined) {
        this.initFcm();
      }
    });
  }

  initFcm = () => {
    messaging
      .requestPermission()
      .then(async () => {
        console.log('getting token...');
        const token = await messaging.getToken();
        console.log('token', token);

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
      firebase
        .database()
        .ref('/users/' + uid)
        .update({ token: clientToken });
      console.log('write to db');
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

  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  sendMessage = async () => {
    const textInput = this.textInputRef.current;
    if (!textInput.checkValidity()) {
      this.textInputErrorMessageRef.current.innerHTML =
        textInput.validationMessage;
    } else {
      // POST text to the API
      await fetch(`/api/report`, {
        method: 'post',
        body: JSON.stringify({
          deviceId: 1234,
          text: textInput.value,
          date: Date.now()
        })
      })
        .then(() => {
          // clear the text input field if sent successfully
          textInput.value = '';
        })
        .catch(error => {
          console.log(error);
        });
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
        await fetch(`/api/register`, {
          method: 'post',
          body: JSON.stringify({ deviceId, userId: uid })
        })
          .then(() => {
            deviceIdInput.value = '';
          })
          .catch(error => console.log(error));
      }
    }
  };

  render() {
    const { messages, clientToken, reports } = this.state;
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
            firebase.auth().signOut();
            // redirect to landing page
            window.location.href = '/';
          }}
        >
          Sign-out
        </button>
        <p>{clientToken}</p>

        <h4>Register monitoring device</h4>
        <input
          type="number"
          ref={this.registerDeviceInputRef}
          required
          placeholder="device id"
        />
        <button onClick={this.registerDevice}>Register</button>
        <p ref={this.registerDeviceInputErrorMessageRef} />

        <h4>Simulation for device sending report</h4>
        <input
          type="text"
          ref={this.textInputRef}
          required
          placeholder="report text"
        />
        <button onClick={this.sendMessage}>Send</button>
        <p ref={this.textInputErrorMessageRef} />

        <h4>Device reports</h4>
        <ul>
          {reports &&
            reports.map((report, index) => <li key={index}>{report}</li>)}
        </ul>

        <h4>Push notifications</h4>
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
