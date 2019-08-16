import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
// import logo from './logo.svg';
import './App.css';
import { Navigation, LandingPage, Dashboard } from './components';

const NotFound = ({ location }) => (
  <div>
    <h3>
      No match for <code>{location.pathname}</code>
    </h3>
  </div>
);

class App extends Component {
  componentDidMount = () => {
    fetch('/addMessage?text=cra-test-api').catch(error => {
      console.log(error);
    });
  };

  render() {
    return (
      <>
        <Router>
          <Navigation />
          <Switch>
            <Route exact path="/" component={LandingPage} />
            <Route path="/dashboard" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </>
    );
  }
}

export default App;
