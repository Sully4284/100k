import React, { useState, useEffect } from 'react';
import Header from './Header';
import PixelCanvas from './PixelCanvas';
import PurchaseModal from './PurchaseModal';
import api from './api';
import './App.css';

function App() {
  const [pixels, setPixels] = useState([]);
  const [gridInfo, setGridInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedPixels, setSelectedPixels] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
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
      // For now, just update locally without authentication
      // You can add auth back later when needed
      const newPixels = pixelData.map(p => ({
        ...p,
        id: Math.random(),
        username: 'Anonymous',
        purchasedAt: new Date().toISOString()
      }));

      setPixels([...pixels, ...newPixels]);
      setShowPurchaseModal(false);
      setSelectedPixels([]);
      alert('Pixels selected! (Demo mode - no actual purchase)');
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header stats={stats} />

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

        {selectedPixels.length > 0 && (
          <button className="purchase-fab" onClick={handlePurchaseClick}>
            Select {selectedPixels.length} pixel{selectedPixels.length !== 1 ? 's' : ''} (${selectedPixels.length})
          </button>
        )}
      </div>

      {showPurchaseModal && (
        <PurchaseModal
          selectedPixels={selectedPixels}
          onPurchase={handlePurchase}
          onCancel={() => setShowPurchaseModal(false)}
        />
      )}
    </div>
  );
}

export default App;
