import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => (
  <nav className="navigation">
    <ul>
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <Link to="/dashboard">Dashboard</Link>
      </li>
    </ul>
  </nav>
);

export default Navigation;
