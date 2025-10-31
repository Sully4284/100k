import React from 'react';
import './Header.css';

const Header = ({ stats }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1>100k Pixel Homepage</h1>
          {stats && (
            <div className="stats">
              <span>{stats.totalPixelsPurchased.toLocaleString()} / 100,000 pixels sold</span>
              <span className="stat-separator">•</span>
              <span>{stats.percentageSold}% complete</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
