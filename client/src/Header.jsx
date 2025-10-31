import React from 'react';
import './Header.css';

const Header = ({ user, stats, onLogout, onShowAdmin }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1>100k Pixel Homepage</h1>
          {stats && (
            <div className="stats">
              <span>{stats.totalPixelsPurchased.toLocaleString()} / {stats.totalPixelsAvailable.toLocaleString()} pixels sold</span>
              <span className="stat-separator">•</span>
              <span>{stats.percentageSold}% complete</span>
              <span className="stat-separator">•</span>
              <span>${stats.totalRevenue.toLocaleString()} raised</span>
            </div>
          )}
        </div>

        <div className="header-right">
          {user ? (
            <>
              <span className="username">👤 {user.username}</span>
              {user.isAdmin && (
                <button className="admin-btn" onClick={onShowAdmin}>
                  Admin Panel
                </button>
              )}
              <button className="logout-btn" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <span className="username">Not logged in</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
