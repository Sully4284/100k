import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Grid configuration
const GRID_WIDTH = 500;
const GRID_HEIGHT = 200;
const TOTAL_PIXELS = GRID_WIDTH * GRID_HEIGHT;

// In-memory storage (simple version, no database needed!)
let pixels = [];
let purchaseCount = 0;

// ============================================================================
// Pixel Routes
// ============================================================================

// Get all pixels
app.get('/api/pixels', (req, res) => {
  res.json(pixels);
});

// Get grid info
app.get('/api/grid/info', (req, res) => {
  res.json({
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    totalPixels: TOTAL_PIXELS,
    pricePerPixel: 1
  });
});

// Purchase pixels (simplified - no auth needed for demo)
app.post('/api/pixels/purchase', (req, res) => {
  try {
    const { pixels: newPixels } = req.body;

    if (!newPixels || !Array.isArray(newPixels) || newPixels.length === 0) {
      return res.status(400).json({ error: 'Invalid pixels data' });
    }

    // Add pixels with IDs
    const pixelsToAdd = newPixels.map(p => ({
      ...p,
      id: ++purchaseCount,
      username: 'Demo User',
      purchasedAt: new Date().toISOString()
    }));

    pixels.push(...pixelsToAdd);

    res.json({
      success: true,
      message: `Successfully purchased ${newPixels.length} pixels`,
      totalCost: newPixels.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to purchase pixels' });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const totalPixelsPurchased = pixels.length;
    const totalRevenue = totalPixelsPurchased;

    res.json({
      totalUsers: 1,
      totalPixelsPurchased,
      totalPixelsAvailable: TOTAL_PIXELS - totalPixelsPurchased,
      totalRevenue,
      percentageSold: ((totalPixelsPurchased / TOTAL_PIXELS) * 100).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Grid size: ${GRID_WIDTH}x${GRID_HEIGHT} = ${TOTAL_PIXELS} pixels`);
  console.log(`🌐 Open http://localhost:3000 in your browser`);
});
