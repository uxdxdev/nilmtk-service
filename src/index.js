import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import * as firebaseUtils from './utils/firebaseUtils';

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
const config = {
  onUpdate: () => {
    console.log('Reloading page to get latest updates.');
    window.location.reload();
  },
  onSuccess: () => {
    console.log('Successful registration');
  }
};
serviceWorker.register(config);
firebaseUtils.registerServiceWorker();
