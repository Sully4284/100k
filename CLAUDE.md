# CLAUDE.md - AI Assistant Guide for 100k Pixel Homepage

## Project Overview

**100k Pixel Homepage** is a modern take on the Million Dollar Homepage concept, featuring a collaborative 500×200 pixel grid (100,000 total pixels) where users can purchase, customize, and interact with pixels.

- **Primary Goal**: Create an interactive pixel canvas where users can buy pixels for $1 each and customize them with colors, links, and tooltips
- **Current Status**: Functional demo mode with core features implemented
- **Recent Changes**:
  - Removed login requirement (demo mode enabled)
  - Fixed blank screen issues with improved initial zoom
  - Complete base application implemented

## Architecture

### Monorepo Structure
This is a monorepo with separate client and server applications:
- **Client**: React 18 + Vite frontend (runs on port 3000)
- **Server**: Express.js backend with SQLite (runs on port 3001)
- **Communication**: REST API with Vite proxy configuration

### Technology Stack

#### Frontend (`/client`)
- **Framework**: React 18.2.0 with hooks
- **Build Tool**: Vite 5.0.8 (fast development and build)
- **Rendering**: Canvas API for high-performance pixel grid
- **State Management**: React Context API (AuthContext)
- **Styling**: Plain CSS with component-specific stylesheets
- **HTTP Client**: Native Fetch API wrapped in `api.js`

#### Backend (`/server`)
- **Runtime**: Node.js with ES Modules (`"type": "module"`)
- **Framework**: Express 4.18.2
- **Database**: SQLite with better-sqlite3 (synchronous API)
- **Authentication**: JWT (jsonwebtoken) with bcryptjs hashing
- **CORS**: Enabled for cross-origin requests
- **Environment**: dotenv for configuration

## Directory Structure

```
100k/
├── client/                      # React frontend application
│   ├── src/
│   │   ├── App.jsx             # Main app component, state management
│   │   ├── App.css             # Main app styles
│   │   ├── PixelCanvas.jsx     # Canvas rendering, pan/zoom, selection
│   │   ├── PixelCanvas.css     # Canvas-specific styles
│   │   ├── AuthForm.jsx        # Login/registration forms
│   │   ├── AuthForm.css        # Auth form styles
│   │   ├── AuthContext.jsx     # Authentication context provider
│   │   ├── PurchaseModal.jsx   # Pixel purchase flow UI
│   │   ├── PurchaseModal.css   # Purchase modal styles
│   │   ├── AdminPanel.jsx      # Admin dashboard component
│   │   ├── AdminPanel.css      # Admin panel styles
│   │   ├── Header.jsx          # Top navigation bar
│   │   ├── Header.css          # Header styles
│   │   ├── api.js              # API client class (singleton)
│   │   ├── main.jsx            # React app entry point
│   │   └── index.css           # Global styles
│   ├── index.html              # HTML template
│   ├── vite.config.js          # Vite configuration (proxy setup)
│   └── package.json            # Client dependencies
│
├── server/                      # Express backend application
│   ├── index.js                # Main Express server, routes
│   ├── database.js             # SQLite setup and schema
│   ├── auth.js                 # JWT and bcrypt utilities
│   ├── .env.example            # Example environment variables
│   ├── pixels.db               # SQLite database (gitignored)
│   └── package.json            # Server dependencies
│
├── package.json                # Root package.json (workspace scripts)
├── README.md                   # User-facing documentation
├── CLAUDE.md                   # This file (AI assistant guide)
└── .gitignore                  # Git ignore rules
```

## Key Files and Their Responsibilities

### Server Files

#### `server/index.js` (289 lines)
- **Primary Purpose**: Express application with all API routes
- **Structure**: Well-organized route groups with comments
  - Auth Routes: `/api/auth/*` (register, login, me)
  - Pixel Routes: `/api/pixels/*` (CRUD operations)
  - Admin Routes: `/api/admin/*` (requires admin middleware)
  - Public Routes: `/api/stats` (public statistics)
- **Constants**: Grid dimensions defined at top (GRID_WIDTH=500, GRID_HEIGHT=200)
- **Middleware**: CORS, express.json(), custom auth/admin middleware
- **Error Handling**: Try-catch blocks with appropriate HTTP status codes

#### `server/database.js` (46 lines)
- **Purpose**: Initialize SQLite database and create schema
- **Configuration**: WAL mode enabled for better concurrency
- **Tables**:
  - `users` (id, username, email, password, isAdmin, createdAt)
  - `pixels` (id, x, y, userId, color, imageUrl, linkUrl, tooltip, timestamps)
- **Indexes**: Coordinate lookup (x,y) and user lookup (userId)
- **Export**: Default export of database instance

#### `server/auth.js` (52 lines)
- **Purpose**: Authentication utilities and middleware
- **Functions**:
  - `hashPassword(password)` - bcrypt hash with salt rounds 10
  - `comparePassword(password, hash)` - bcrypt comparison
  - `generateToken(user)` - JWT with 7-day expiration
  - `verifyToken(token)` - JWT verification
  - `authMiddleware(req, res, next)` - Extract and validate Bearer token
  - `adminMiddleware(req, res, next)` - Check user.isAdmin flag
- **Security**: JWT secret from env or default (warn about production)

### Client Files

#### `client/src/App.jsx` (124 lines)
- **Purpose**: Root application component and main state container
- **State Management**:
  - `pixels` - All purchased pixels from API
  - `gridInfo` - Grid dimensions and pricing
  - `stats` - Public statistics
  - `selectedPixels` - Current user selection
  - `showPurchaseModal` - Modal visibility
- **Key Functions**:
  - `loadData()` - Parallel fetch of pixels, grid info, stats
  - `handleSelectionChange()` - Update selection from canvas
  - `handlePurchaseClick()` - Validate and show purchase modal
  - `handlePurchase()` - Demo mode implementation (no auth)
- **Current Mode**: Demo mode - purchases don't require authentication

#### `client/src/PixelCanvas.jsx` (12,051 bytes)
- **Purpose**: High-performance canvas rendering with pan/zoom/selection
- **State**:
  - Pan/Zoom: `scale` (default 3), `offset` (x, y)
  - Interaction: `isPanning`, `isSelecting`, mouse positions
  - Selection: `selectionStart`, `selectionEnd`, `hoveredPixel`
- **Key Features**:
  - Canvas-based rendering for performance
  - Mouse: wheel zoom, shift+drag pan, click-drag select
  - Touch: pinch-to-zoom, two-finger pan, tap-drag select
  - Viewport culling: only render visible pixels
  - Pixel map for O(1) ownership lookup
- **Coordinate System**: `screenToGrid()` converts mouse/touch to grid coords

#### `client/src/api.js` (114 lines)
- **Purpose**: Centralized API client (singleton pattern)
- **Architecture**: Class-based with token management
- **Token Storage**: localStorage with automatic persistence
- **Methods**: Mirror server endpoints (camelCase naming)
  - Auth: `register()`, `login()`, `getMe()`, `logout()`
  - Pixels: `getPixels()`, `purchasePixels()`, `updatePixels()`, `getMyPixels()`
  - Admin: `getUsers()`, `deletePixel(x, y)`
  - Public: `getStats()`, `getGridInfo()`
- **Headers**: Automatic Bearer token injection when authenticated
- **Error Handling**: Throws errors with server error messages

#### `client/src/AuthContext.jsx` (61 lines)
- **Purpose**: React Context for global auth state
- **Provider**: `AuthProvider` component wraps app
- **Hook**: `useAuth()` for consuming auth context
- **State**: `user` object, `loading` flag
- **Initialization**: Checks localStorage token on mount
- **Methods**: `login()`, `register()`, `logout()` - wrap api.js

## Development Workflow

### Initial Setup

```bash
# Install all dependencies
npm run install:all

# Or install separately
cd server && npm install
cd ../client && npm install
```

### Running Development Servers

**Always run both servers simultaneously in separate terminals:**

```bash
# Terminal 1 - Backend (port 3001)
cd server
npm run dev        # Uses --watch flag for auto-reload

# Terminal 2 - Frontend (port 3000)
cd client
npm run dev        # Vite dev server with HMR
```

### Environment Setup

1. Copy `server/.env.example` to `server/.env`
2. Change `JWT_SECRET` to a secure random string for production
3. Set `NODE_ENV=production` for production deployments

### Building for Production

```bash
# Build client (outputs to client/dist/)
cd client
npm run build

# Preview production build
npm run preview
```

### Database Management

**Creating Admin User:**
```bash
# 1. Register through UI first
# 2. Run SQL to grant admin privileges
cd server
sqlite3 pixels.db "UPDATE users SET isAdmin = 1 WHERE username = 'your-username';"
```

**Database Location**: `server/pixels.db` (auto-created on first run)

## Code Conventions

### General Patterns

1. **ES Modules**: All files use `import/export` syntax
2. **Async/Await**: Preferred over .then() chains
3. **Error Handling**: Try-catch blocks with specific error messages
4. **Comments**: Section dividers in large files (see server/index.js)

### React Conventions

1. **Functional Components**: No class components used
2. **Hooks**: useState, useEffect, useCallback, useRef, useContext
3. **File Structure**: Component logic, then export default
4. **CSS**: One CSS file per component (same name)
5. **Props**: Destructured in function parameters
6. **State Naming**: Descriptive names, set functions use `set` prefix
7. **Event Handlers**: Named `handle[Action]` (e.g., `handlePurchaseClick`)

### Server Conventions

1. **Route Organization**: Grouped by feature with comment headers
2. **Middleware Order**: authMiddleware, then adminMiddleware when needed
3. **Response Format**:
   - Success: `{ success: true, ...data }`
   - Error: `{ error: 'message' }` with appropriate status code
4. **Database**: Synchronous API (better-sqlite3)
5. **Transactions**: Use `db.transaction()` for multi-row operations
6. **SQL**: Prepared statements for all queries (prevents injection)

### Naming Conventions

- **Files**: PascalCase for components (App.jsx), camelCase for utilities (api.js)
- **Components**: PascalCase (PixelCanvas)
- **Functions**: camelCase (loadData, handlePurchase)
- **Constants**: UPPER_SNAKE_CASE (GRID_WIDTH, TOTAL_PIXELS)
- **CSS Classes**: kebab-case (pixel-canvas, purchase-fab)

## API Design

### REST Principles

- **Resource-based URLs**: `/api/pixels`, `/api/users`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
- **Status Codes**:
  - 200: Success
  - 400: Bad request / validation error
  - 401: Unauthorized (no/invalid token)
  - 403: Forbidden (valid token, insufficient permissions)
  - 404: Not found
  - 500: Server error

### Authentication Flow

1. **Registration**: POST `/api/auth/register` → returns user + token
2. **Login**: POST `/api/auth/login` → returns user + token
3. **Token Storage**: Client stores in localStorage
4. **Authenticated Requests**: `Authorization: Bearer <token>` header
5. **Token Validation**: authMiddleware extracts and verifies JWT
6. **Token Expiry**: 7 days (set in auth.js)

### Pixel Purchase Flow

1. User selects pixels on canvas (client-side validation)
2. Client checks selection doesn't include owned pixels
3. POST `/api/pixels/purchase` with pixel array
4. Server validates coordinates and ownership
5. Server uses transaction to insert all pixels atomically
6. Client refreshes pixel data

### Current Demo Mode

- **Authentication**: Bypassed in App.jsx
- **Purchase**: Stores locally, doesn't call server
- **Username**: Shows as "Anonymous"
- **Re-enabling Auth**: Restore original App.jsx purchase logic

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,          -- bcrypt hash
  isAdmin INTEGER DEFAULT 0,       -- 0 or 1 (boolean)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Pixels Table
```sql
CREATE TABLE pixels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,              -- 0-499
  y INTEGER NOT NULL,              -- 0-199
  userId INTEGER NOT NULL,         -- Foreign key to users
  color TEXT DEFAULT '#ffffff',    -- Hex color code
  imageUrl TEXT,                   -- Optional image URL
  linkUrl TEXT,                    -- Optional clickable link
  tooltip TEXT,                    -- Optional hover text
  purchasedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE(x, y)                     -- One owner per coordinate
);

CREATE INDEX idx_pixels_coords ON pixels(x, y);
CREATE INDEX idx_pixels_user ON pixels(userId);
```

## State Management

### Global State (Context)

- **AuthContext**: User authentication state
  - Accessed via `useAuth()` hook
  - Persists across navigation
  - Auto-initializes from localStorage

### Component State (App.jsx)

- **pixels**: Master list of all purchased pixels
- **gridInfo**: Grid configuration from server
- **stats**: Public statistics
- **selectedPixels**: Current selection (array of {x, y})
- **showPurchaseModal**: Boolean for modal visibility

### Local Component State

- **PixelCanvas**: Pan/zoom, interaction modes, hover state
- **PurchaseModal**: Form inputs (color, link, tooltip)
- **AdminPanel**: User list, loading states

## Common Development Tasks

### Adding a New API Endpoint

1. **Server** (`server/index.js`):
   ```javascript
   app.get('/api/your-endpoint', authMiddleware, (req, res) => {
     try {
       // Implementation
       res.json({ data: result });
     } catch (error) {
       res.status(500).json({ error: 'Error message' });
     }
   });
   ```

2. **API Client** (`client/src/api.js`):
   ```javascript
   async yourEndpoint() {
     return this.request('/your-endpoint');
   }
   ```

3. **Component Usage**:
   ```javascript
   const data = await api.yourEndpoint();
   ```

### Adding a New Component

1. Create `ComponentName.jsx` and `ComponentName.css` in `client/src/`
2. Use functional component with hooks
3. Import and use in parent component
4. Follow existing component structure patterns

### Modifying Canvas Behavior

- **PixelCanvas.jsx** contains all canvas logic
- Key functions:
  - `draw()` - Rendering loop
  - `screenToGrid()` - Coordinate conversion
  - `getSelectionRect()` - Selection calculation
  - Event handlers for mouse/touch

### Database Migrations

Since using SQLite with simple schema:
1. Modify `server/database.js` CREATE TABLE statements
2. Delete `server/pixels.db` (dev only)
3. Restart server to recreate with new schema
4. For production: Write manual migration SQL

## Security Considerations

### Current Implementation

- **Password Hashing**: bcrypt with 10 salt rounds
- **SQL Injection**: Prevented via prepared statements
- **CSRF**: Not implemented (consider for production)
- **Rate Limiting**: Not implemented (add for production)
- **Input Validation**: Basic validation on email, password length
- **XSS**: React escapes by default, but sanitize user URLs

### Production Checklist

- [ ] Change JWT_SECRET to cryptographically random string
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add email verification
- [ ] Sanitize user-provided URLs (linkUrl, imageUrl)
- [ ] Set up HTTPS/SSL
- [ ] Migrate to PostgreSQL or MySQL
- [ ] Add CSRF protection
- [ ] Implement API versioning (/api/v1)
- [ ] Add monitoring and logging
- [ ] Set secure cookie flags if using cookies

## Canvas Rendering Performance

### Optimization Techniques Used

1. **Viewport Culling**: Only render visible pixels
2. **Pixel Map**: Map<string, pixel> for O(1) lookup vs O(n) array search
3. **RequestAnimationFrame**: Smooth rendering updates
4. **Event Debouncing**: Prevents excessive redraws
5. **Canvas API**: Direct pixel manipulation vs DOM elements

### Performance Notes

- Grid size: 500×200 = 100,000 pixels
- Typical visible pixels: ~5,000-10,000 depending on zoom
- Rendering: <16ms per frame at normal zoom levels
- Memory: Pixel map is ~100KB for full grid

## Mobile Support

### Touch Gestures
- **Pinch-to-zoom**: Two-finger pinch in/out
- **Two-finger pan**: Drag with two fingers
- **Selection**: Tap and drag single finger
- **Tap**: Click pixel for details

### Responsive Design
- CSS media queries for mobile layout
- Touch-friendly button sizes
- Modal adapts to screen size
- Canvas fills available space

## Testing Recommendations

### Manual Testing Checklist
- [ ] Register new user
- [ ] Login with existing user
- [ ] Select pixels (click-drag)
- [ ] Purchase pixels
- [ ] Verify pixel ownership (hover)
- [ ] Update owned pixels
- [ ] Admin panel (if admin user)
- [ ] Pan and zoom canvas
- [ ] Mobile touch gestures

### Automated Testing (Not Currently Implemented)
- Unit tests: Jest + React Testing Library
- API tests: Supertest
- E2E tests: Playwright or Cypress
- Coverage goal: >80%

## Troubleshooting

### Common Issues

**Blank Canvas**
- Check initial zoom level (should be ≥2)
- Verify offset values place grid in viewport
- Check browser console for Canvas API errors

**Auth Errors**
- Verify JWT_SECRET matches between server instances
- Check token expiration (7 days)
- Clear localStorage and re-login

**Pixel Selection Not Working**
- Check coordinate conversion (screenToGrid)
- Verify grid bounds checking
- Test with different zoom levels

**Database Errors**
- Check file permissions on pixels.db
- Verify SQLite is installed (better-sqlite3 requires native build)
- Check SQL syntax in queries

**CORS Errors**
- Verify Vite proxy configuration (vite.config.js)
- Check server CORS middleware
- Ensure both servers are running

## Git Workflow

### Branch Strategy
- **Main Branch**: Currently using `claude/claude-md-mhz42sbx38yixh89-011WzwHFtSLRW8m9JSCUdH2G`
- **Feature Branches**: Create from current branch
- **Commits**: Descriptive messages, present tense

### Recent History
- `938a17a` - Fix blank screen - increase initial zoom and brighten available pixels
- `eff2388` - Remove login requirement - allow demo mode without authentication
- `4692da2` - Add complete 100k pixel homepage application

### Commit Message Style
- Descriptive, concise
- Start with verb (Add, Fix, Update, Remove)
- Reference issue/feature if applicable

## Future Enhancements (from README)

### High Priority
- Payment integration (Stripe, PayPal)
- Re-enable authentication for production
- API rate limiting
- Email verification

### Medium Priority
- Image upload for pixels (currently URL only)
- Pixel marketplace (resale functionality)
- Export grid as image
- Analytics dashboard

### Low Priority
- Social features (comments, likes)
- Multiple grid themes
- Grid history/timeline
- User profiles

## AI Assistant Guidelines

### When Making Changes

1. **Read First**: Always read relevant files before editing
2. **Understand Context**: Check how similar features are implemented
3. **Follow Conventions**: Match existing code style and patterns
4. **Test Locally**: Verify both client and server work together
5. **Update Documentation**: Update this file if architecture changes

### Best Practices

- **Preserve Working Features**: Demo mode is intentional, don't "fix" it
- **Maintain Consistency**: Use existing patterns (e.g., api.js methods)
- **Consider Performance**: Canvas rendering is performance-critical
- **Security First**: Validate inputs, use prepared statements
- **Mobile Support**: Test touch interactions when changing canvas

### Common Requests

**"Add authentication"**: Auth exists but bypassed in App.jsx demo mode
**"Fix the database"**: Database auto-creates, check permissions
**"Improve performance"**: Canvas already optimized, check viewport culling
**"Add a feature"**: Follow API endpoint → client integration pattern

## Quick Reference

### File Locations
- Server routes: `server/index.js`
- Database schema: `server/database.js`
- API client: `client/src/api.js`
- Canvas logic: `client/src/PixelCanvas.jsx`
- Main app state: `client/src/App.jsx`

### Environment Variables
- `PORT`: Server port (default 3001)
- `JWT_SECRET`: JWT signing key (change for production!)
- `NODE_ENV`: development | production

### Grid Configuration
- Width: 500 pixels
- Height: 200 pixels
- Total: 100,000 pixels
- Price: $1 per pixel

### Ports
- Frontend: 3000 (Vite dev server)
- Backend: 3001 (Express)
- Production: Serve client build from Express

---

**Last Updated**: 2024-11-14
**Version**: 1.0.0
**Maintainer**: AI Assistant
