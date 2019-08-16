import React from 'react';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.textInput = React.createRef();
    this.inputErrorMessage = React.createRef();
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
    return (
      <>
        <p>This is the dashboard page.</p>

        <input
          type="text"
          ref={this.textInput}
          required
          pattern="[A-Za-z]{1,20}"
        />
        <p ref={this.inputErrorMessage} />
        <button onClick={this.sendMessage}>Send</button>
      </>
    );
  }
}

export default Dashboard;
