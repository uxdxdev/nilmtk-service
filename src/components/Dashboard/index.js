/* eslint no-undef: "warn" */
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
    this.textInput = React.createRef();
    this.inputErrorMessage = React.createRef();

    this.state = {
      messages: [],
      clientToken: 'null',
      isSignedIn: undefined,
      uid: undefined
    };
  }

  componentDidMount() {
    ui.start('#firebaseui-auth-container', uiConfig);

    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      const { uid } = user;
      const { clientToken } = this.state;
      if (uid !== undefined && clientToken !== undefined) {
        firebase
          .database()
          .ref('/users/' + uid)
          .set({ token: clientToken });
        console.log('write to db');
      }
      this.setState({ isSignedIn: !!user });
    });

    messaging
      .requestPermission()
      .then(async () => {
        const token = await messaging.getToken();
        this.setState({ clientToken: token });
      })
      .catch(function(err) {
        console.log('Unable to get permission to notify.', err);
      });

    // event listener for new push notifications
    navigator.serviceWorker.addEventListener('message', message => {
      console.log(message);
      const { data } = message;
      const messageObject = data['firebase-messaging-msg-data'];
      const { notification } = messageObject;
      const { messages } = this.state;
      messages.push(notification);
      this.setState({ messages });
    });
  }

  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  sendMessage = () => {
    const textInput = this.textInput.current;
    if (!textInput.checkValidity()) {
      this.inputErrorMessage.current.innerHTML = textInput.validationMessage;
    } else {
      // POST text to the API
      fetch(`/api/report`, {
        method: 'post',
        body: JSON.stringify({ deviceId: 1234, text: textInput.value })
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

  render() {
    const { messages, clientToken } = this.state;
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
        <input
          type="text"
          ref={this.textInput}
          required
          // pattern="[A-Za-z]{1,}"
        />
        <p ref={this.inputErrorMessage} />
        <button onClick={this.sendMessage}>Send</button>
        <ul>
          {messages.map((message, index) => (
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
