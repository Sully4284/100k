import React, { useState, useEffect } from 'react';
import api from './api';
import './AdminPanel.css';

const AdminPanel = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, statsData] = await Promise.all([
        api.getUsers(),
        api.getStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <>
            {stats && (
              <div className="admin-stats">
                <h3>Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Total Users</div>
                    <div className="stat-value">{stats.totalUsers}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Pixels Sold</div>
                    <div className="stat-value">{stats.totalPixelsPurchased.toLocaleString()}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Pixels Available</div>
                    <div className="stat-value">{stats.totalPixelsAvailable.toLocaleString()}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Completion</div>
                    <div className="stat-value">{stats.percentageSold}%</div>
                  </div>
                </div>
              </div>
            )}

            <div className="admin-users">
              <h3>Users ({users.length})</h3>
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Admin</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.isAdmin ? '✓' : ''}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
