import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
// import logo from './logo.svg';
import './App.css';
import { Navigation, LandingPage, Dashboard } from './components';

class App extends Component {
  componentDidMount = () => {
    fetch('/test')
      .then(data => {
        return data.text();
      })
      .then(function(data) {
        console.log(data); // this will be a string
      });
  };
  render() {
    return (
      <>
        <Router>
          <Navigation />
          <Route exact path="/" component={LandingPage} />
          <Route path="/dashboard" component={Dashboard} />
        </Router>
      </>
    );
  }
}

export default App;
