import React from 'react';
import { Link } from 'react-router-dom';
import { useColorMode, Button } from '@chakra-ui/core';

const ColorMode = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Button onClick={toggleColorMode}>
      Toggle {colorMode === 'light' ? 'Dark' : 'Light'}
    </Button>
  );
};

const Navigation = () => (
  <nav className="navigation">
    <ul>
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <Link to="/dashboard">Dashboard</Link>
      </li>
      <li>
        <ColorMode />
      </li>
    </ul>
  </nav>
);

export default Navigation;
