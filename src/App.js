import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
// import logo from './logo.svg';
import './App.css';
import { Navigation, LandingPage, Dashboard, NotFound } from './components';
import { ThemeProvider, ColorModeProvider } from '@chakra-ui/core';

class App extends Component {
  render() {
    return (
      <ThemeProvider>
        <ColorModeProvider>
          <Router>
            <Navigation />
            <Switch>
              <Route exact path="/" component={LandingPage} />
              <Route path="/dashboard" component={Dashboard} />
              <Route component={NotFound} />
            </Switch>
          </Router>
        </ColorModeProvider>
      </ThemeProvider>
    );
  }
}

export default App;
