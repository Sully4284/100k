import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './database.js';
import { hashPassword, comparePassword, generateToken, authMiddleware, adminMiddleware } from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Grid configuration
const GRID_WIDTH = 500;
const GRID_HEIGHT = 200;
const TOTAL_PIXELS = GRID_WIDTH * GRID_HEIGHT;

// ============================================================================
// Auth Routes
// ============================================================================

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = hashPassword(password);

    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(username, email, hashedPassword);

    const user = { id: result.lastInsertRowid, username, email, isAdmin: 0 };
    const token = generateToken(user);

    res.json({ user: { id: user.id, username, email, isAdmin: false }, token });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !comparePassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.isAdmin = Boolean(user.isAdmin);

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, isAdmin, createdAt FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.isAdmin = Boolean(user.isAdmin);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================================================
// Pixel Routes
// ============================================================================

// Get all pixels
app.get('/api/pixels', (req, res) => {
  try {
    const pixels = db.prepare(`
      SELECT p.*, u.username
      FROM pixels p
      JOIN users u ON p.userId = u.id
    `).all();
    res.json(pixels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pixels' });
  }
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

// Purchase pixels
app.post('/api/pixels/purchase', authMiddleware, (req, res) => {
  try {
    const { pixels } = req.body; // Array of {x, y, color, imageUrl, linkUrl, tooltip}

    if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
      return res.status(400).json({ error: 'Invalid pixels data' });
    }

    // Validate all pixels are within bounds
    for (const pixel of pixels) {
      if (pixel.x < 0 || pixel.x >= GRID_WIDTH || pixel.y < 0 || pixel.y >= GRID_HEIGHT) {
        return res.status(400).json({ error: `Pixel out of bounds: (${pixel.x}, ${pixel.y})` });
      }
    }

    // Check if any pixels are already owned
    const coords = pixels.map(p => `(${p.x}, ${p.y})`).join(',');
    const existing = db.prepare(`
      SELECT x, y FROM pixels WHERE (x, y) IN (${pixels.map(() => '(?, ?)').join(',')})
    `).all(pixels.flatMap(p => [p.x, p.y]));

    if (existing.length > 0) {
      return res.status(400).json({
        error: 'Some pixels are already owned',
        ownedPixels: existing
      });
    }

    // Insert all pixels in a transaction
    const insert = db.prepare(`
      INSERT INTO pixels (x, y, userId, color, imageUrl, linkUrl, tooltip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((pixelsToInsert) => {
      for (const pixel of pixelsToInsert) {
        insert.run(
          pixel.x,
          pixel.y,
          req.user.id,
          pixel.color || '#ffffff',
          pixel.imageUrl || null,
          pixel.linkUrl || null,
          pixel.tooltip || null
        );
      }
    });

    insertMany(pixels);

    res.json({
      success: true,
      message: `Successfully purchased ${pixels.length} pixels`,
      totalCost: pixels.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to purchase pixels' });
  }
});

// Update pixels (only owner or admin)
app.put('/api/pixels/update', authMiddleware, (req, res) => {
  try {
    const { pixels } = req.body; // Array of {x, y, color, imageUrl, linkUrl, tooltip}

    if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
      return res.status(400).json({ error: 'Invalid pixels data' });
    }

    const update = db.prepare(`
      UPDATE pixels
      SET color = ?, imageUrl = ?, linkUrl = ?, tooltip = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE x = ? AND y = ? AND (userId = ? OR ? = 1)
    `);

    const updateMany = db.transaction((pixelsToUpdate) => {
      for (const pixel of pixelsToUpdate) {
        const result = update.run(
          pixel.color || '#ffffff',
          pixel.imageUrl || null,
          pixel.linkUrl || null,
          pixel.tooltip || null,
          pixel.x,
          pixel.y,
          req.user.id,
          req.user.isAdmin ? 1 : 0
        );

        if (result.changes === 0) {
          throw new Error(`No permission to update pixel at (${pixel.x}, ${pixel.y})`);
        }
      }
    });

    updateMany(pixels);

    res.json({ success: true, message: `Successfully updated ${pixels.length} pixels` });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

// Get user's pixels
app.get('/api/pixels/mine', authMiddleware, (req, res) => {
  try {
    const pixels = db.prepare('SELECT * FROM pixels WHERE userId = ?').all(req.user.id);
    res.json(pixels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pixels' });
  }
});

// ============================================================================
// Admin Routes
// ============================================================================

// Get all users (admin only)
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, email, isAdmin, createdAt FROM users').all();
    res.json(users.map(u => ({ ...u, isAdmin: Boolean(u.isAdmin) })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete pixel (admin only)
app.delete('/api/admin/pixels/:x/:y', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { x, y } = req.params;
    const result = db.prepare('DELETE FROM pixels WHERE x = ? AND y = ?').run(x, y);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pixel not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete pixel' });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalPixelsPurchased = db.prepare('SELECT COUNT(*) as count FROM pixels').get().count;
    const totalRevenue = totalPixelsPurchased; // $1 per pixel

    res.json({
      totalUsers,
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Grid size: ${GRID_WIDTH}x${GRID_HEIGHT} = ${TOTAL_PIXELS} pixels`);
});
