import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Header from './Header';
import PixelCanvas from './PixelCanvas';
import AuthForm from './AuthForm';
import PurchaseModal from './PurchaseModal';
import AdminPanel from './AdminPanel';
import api from './api';
import './App.css';

function AppContent() {
  const { user, loading: authLoading, login, register, logout } = useAuth();

  const [pixels, setPixels] = useState([]);
  const [gridInfo, setGridInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedPixels, setSelectedPixels] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pixelsData, gridData, statsData] = await Promise.all([
        api.getPixels(),
        api.getGridInfo(),
        api.getStats(),
      ]);
      setPixels(pixelsData);
      setGridInfo(gridData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (selection) => {
    setSelectedPixels(selection);
  };

  const handlePurchaseClick = () => {
    if (!user) {
      alert('Please login to purchase pixels');
      return;
    }

    if (selectedPixels.length === 0) {
      alert('Please select pixels to purchase');
      return;
    }

    // Check if any selected pixels are already owned
    const ownedPixels = selectedPixels.filter(({ x, y }) =>
      pixels.some(p => p.x === x && p.y === y)
    );

    if (ownedPixels.length > 0) {
      alert(`${ownedPixels.length} of the selected pixels are already owned. Please select different pixels.`);
      return;
    }

    setShowPurchaseModal(true);
  };

  const handlePurchase = async (pixelData) => {
    try {
      await api.purchasePixels(pixelData);
      setShowPurchaseModal(false);
      setSelectedPixels([]);
      await loadData(); // Reload data
      alert('Pixels purchased successfully!');
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    setSelectedPixels([]);
  };

  if (authLoading || loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        user={user}
        stats={stats}
        onLogout={handleLogout}
        onShowAdmin={() => setShowAdminPanel(true)}
      />

      <div className="app-content">
        {gridInfo && (
          <PixelCanvas
            gridWidth={gridInfo.width}
            gridHeight={gridInfo.height}
            pixels={pixels}
            selectedPixels={selectedPixels}
            onSelectionChange={handleSelectionChange}
          />
        )}

        {selectedPixels.length > 0 && user && (
          <button className="purchase-fab" onClick={handlePurchaseClick}>
            Purchase {selectedPixels.length} pixel{selectedPixels.length !== 1 ? 's' : ''} (${selectedPixels.length})
          </button>
        )}

        {selectedPixels.length > 0 && !user && (
          <div className="login-prompt">
            Please login to purchase pixels
          </div>
        )}
      </div>

      {!user && <AuthForm onLogin={login} onRegister={register} />}

      {showPurchaseModal && (
        <PurchaseModal
          selectedPixels={selectedPixels}
          onPurchase={handlePurchase}
          onCancel={() => setShowPurchaseModal(false)}
        />
      )}

      {showAdminPanel && user?.isAdmin && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
