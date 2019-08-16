import React from 'react';
import { messaging } from '../../init-fcm';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.textInput = React.createRef();
    this.inputErrorMessage = React.createRef();

    this.state = {
      messages: []
    };
  }

  async componentDidMount() {
    messaging
      .requestPermission()
      .then(async function() {
        const token = await messaging.getToken();
        console.log(token);
      })
      .catch(function(err) {
        console.log('Unable to get permission to notify.', err);
      });
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

  sendMessage = () => {
    const textInput = this.textInput.current;
    const inputErrorMessage = this.inputErrorMessage.current;
    if (!textInput.checkValidity()) {
      inputErrorMessage.innerHTML = textInput.validationMessage;
    } else {
      fetch(`/api/addMessage?text=${textInput.value}`)
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
    const { messages } = this.state;
    return (
      <>
        <p>This is the dashboard page.</p>

        {/* <input
          type="text"
          ref={this.textInput}
          required
          pattern="[A-Za-z]{1,20}"
        />
        <p ref={this.inputErrorMessage} />
        <button onClick={this.sendMessage}>Send</button> */}
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
