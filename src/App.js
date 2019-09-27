import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import { Dashboard, NotFound } from './components';
import {
  ThemeProvider,
  theme,
  ColorModeProvider,
  CSSReset
} from '@chakra-ui/core';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CSSReset />
      <ColorModeProvider value="light">
        <Router>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </ColorModeProvider>
    </ThemeProvider>
  );
};

export default App;
