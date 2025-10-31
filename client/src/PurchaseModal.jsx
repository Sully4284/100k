import React, { useState } from 'react';
import './PurchaseModal.css';

const PurchaseModal = ({ selectedPixels, onPurchase, onCancel }) => {
  const [color, setColor] = useState('#ffffff');
  const [linkUrl, setLinkUrl] = useState('');
  const [tooltip, setTooltip] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalCost = selectedPixels.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const pixels = selectedPixels.map(({ x, y }) => ({
        x,
        y,
        color,
        linkUrl: linkUrl || null,
        tooltip: tooltip || null,
      }));

      await onPurchase(pixels);
    } catch (err) {
      setError(err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Purchase Pixels</h2>

        <div className="purchase-summary">
          <div className="summary-item">
            <span>Pixels selected:</span>
            <strong>{selectedPixels.length}</strong>
          </div>
          <div className="summary-item">
            <span>Total cost:</span>
            <strong>${totalCost}</strong>
          </div>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Color</label>
            <div className="color-picker-group">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#ffffff"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Link URL (optional)</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Tooltip (optional)</label>
            <input
              type="text"
              value={tooltip}
              onChange={(e) => setTooltip(e.target.value)}
              placeholder="Hover text"
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="purchase-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : `Purchase for $${totalCost}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseModal;
