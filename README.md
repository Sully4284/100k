# 100k Pixel Homepage

A modern take on the Million Dollar Homepage with 100,000 pixels (500×200 grid). Users can purchase pixels for $1 each, customize them with colors and links, and build a collaborative digital canvas.

## Features

- **Interactive Canvas**: Pan, zoom, and navigate a 500×200 pixel grid
- **Mobile Optimized**: Full touch support with pinch-to-zoom and drag gestures
- **User Management**: Complete authentication system with registration and login
- **Pixel Purchasing**: Click-and-drag to select and purchase pixels
- **Admin Panel**: Statistics dashboard and user management
- **Real-time Updates**: See purchased pixels instantly
- **Customization**: Set pixel colors, links, and tooltips

## Tech Stack

### Frontend
- React 18
- Vite (fast build tool)
- Canvas API for high-performance rendering
- Responsive CSS with mobile-first design

### Backend
- Node.js + Express
- SQLite database
- JWT authentication
- RESTful API

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 100k
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

You'll need two terminal windows:

**Terminal 1 - Start the backend server:**
```bash
cd server
npm run dev
```
Server runs on http://localhost:3001

**Terminal 2 - Start the frontend:**
```bash
cd client
npm run dev
```
Frontend runs on http://localhost:3000

### Creating an Admin User

To create an admin user, you'll need to manually update the database:

1. First, register a user through the UI
2. Then, run this SQL command to make them an admin:

```bash
cd server
sqlite3 pixels.db "UPDATE users SET isAdmin = 1 WHERE username = 'your-username';"
```

## Usage

### For Regular Users

1. **Register/Login**: Create an account or login with existing credentials
2. **Navigate**: Use mouse wheel or pinch to zoom, shift+drag or two-finger drag to pan
3. **Select Pixels**: Click and drag to select pixels (unowned pixels appear darker)
4. **Purchase**: Click the floating purchase button, customize color/link, and confirm
5. **View Details**: Hover over pixels to see owner and details

### For Administrators

1. **Access Admin Panel**: Click "Admin Panel" button in header
2. **View Statistics**: Total users, pixels sold, revenue, completion percentage
3. **Manage Users**: See all registered users and their information

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Pixels
- `GET /api/pixels` - Get all purchased pixels
- `GET /api/grid/info` - Get grid dimensions and pricing
- `POST /api/pixels/purchase` - Purchase pixels (requires auth)
- `PUT /api/pixels/update` - Update owned pixels (requires auth)
- `GET /api/pixels/mine` - Get user's pixels (requires auth)

### Admin (requires admin auth)
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/pixels/:x/:y` - Delete pixel

### Public
- `GET /api/stats` - Get public statistics

## Project Structure

```
100k/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── PixelCanvas.jsx # Canvas rendering and interactions
│   │   ├── AuthForm.jsx   # Login/register forms
│   │   ├── PurchaseModal.jsx # Purchase flow
│   │   ├── AdminPanel.jsx # Admin dashboard
│   │   ├── Header.jsx     # Top navigation
│   │   ├── AuthContext.jsx # Auth state management
│   │   └── api.js         # API client
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                # Node.js backend
│   ├── index.js          # Express server
│   ├── database.js       # SQLite setup
│   ├── auth.js           # JWT authentication
│   ├── .env              # Environment variables
│   └── package.json
└── README.md
```

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password
- `isAdmin` - Admin flag (0 or 1)
- `createdAt` - Registration timestamp

### Pixels Table
- `id` - Primary key
- `x`, `y` - Grid coordinates (0-499, 0-199)
- `userId` - Owner reference
- `color` - Hex color code
- `imageUrl` - Optional image URL
- `linkUrl` - Optional clickable link
- `tooltip` - Optional hover text
- `purchasedAt` - Purchase timestamp
- `updatedAt` - Last update timestamp

## Mobile Support

The application is fully optimized for mobile devices:

- Touch-friendly interface
- Pinch-to-zoom gesture support
- Two-finger pan gestures
- Responsive layout that adapts to screen size
- Mobile-optimized controls and modals

## Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3001
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

## Building for Production

**Build the frontend:**
```bash
cd client
npm run build
```

The build output will be in `client/dist/`.

**For production deployment:**
1. Set `NODE_ENV=production` in server `.env`
2. Use a production-grade database (PostgreSQL)
3. Set up proper HTTPS/SSL
4. Configure environment variables securely
5. Use a process manager like PM2 for the Node.js server

## Future Enhancements

- Payment integration (Stripe, PayPal)
- Image upload for pixels
- Pixel marketplace (resale)
- Social features (comments, likes)
- Analytics dashboard
- Export/share grid as image
- API rate limiting
- Email verification

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
