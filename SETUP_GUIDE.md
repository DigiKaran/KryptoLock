# 🚀 KryptoLock Complete Setup Guide

This guide will walk you through setting up the complete KryptoLock system with database storage and admin panel.

## 📋 Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **Chrome Browser** - For the extension
- **Git** (optional) - For version control

## 🛠️ Installation Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Initialize Database
```bash
npm run init-db
```
This will:
- Create the SQLite database
- Set up tables for users and credentials
- Create default admin user (admin/admin123)
- Add sample users and credentials

### Step 3: Start the Admin Server
```bash
npm start
```
The server will start on `http://localhost:3000`

### Step 4: Load Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select your `KryptoLock` folder
5. The extension should appear in your extensions list

## 🔐 Accessing the Admin Panel

### Default Login Credentials
- **URL**: `http://localhost:3000/admin`
- **Username**: `admin`
- **Password**: `admin123`

### Admin Panel Features

#### 📊 Dashboard
- View total users and credentials
- Real-time statistics
- Quick navigation

#### 👥 User Management
- **View All Users**: See registered users with details
- **Add New User**: Create users with admin privileges
- **Edit Users**: Modify user information
- **Delete Users**: Remove users (with confirmation)
- **Search Users**: Filter by username or email

#### 🔑 Credential Management
- **View All Credentials**: See stored credentials across users
- **Delete Credentials**: Remove specific credentials
- **Search Credentials**: Filter by website, username, or user
- **User Association**: See credential ownership

## 🔧 Configuration

### Environment Variables
Create a `config.env` file in the root directory:

```env
# Server Configuration
PORT=3000
ADMIN_PASSWORD=your-secure-admin-password

# Database Configuration
DB_PATH=./database/kryptolock.db

# Security Configuration
SESSION_SECRET=your-super-secret-session-key-change-this
```

### Changing Default Admin Password
1. Edit `config.env` file
2. Change `ADMIN_PASSWORD=your-new-password`
3. Restart the server
4. Login with new password

## 📱 Using the Chrome Extension

### First Time Setup
1. Click the KryptoLock icon in Chrome toolbar
2. Set up your master password (minimum 8 characters)
3. Confirm your master password
4. Extension is ready to use!

### Adding Passwords
1. Open extension popup
2. Go to "Add Password" tab
3. Fill in website details:
   - Website Name
   - Website URL
   - Username/Email
   - Password
4. Click "Add Password"

### Auto-fill Feature
1. Visit a website where you've saved credentials
2. Look for blue "🔐 Click to autofill" indicator
3. Click to auto-fill login credentials

### Managing Passwords
- **View**: See all saved credentials
- **Copy**: Copy passwords to clipboard
- **Fill**: Auto-fill on current page
- **Delete**: Remove saved credentials

## 🔗 Integration Options

### Option 1: Local Storage Only (Current)
The extension currently uses Chrome's local storage for password management.

### Option 2: Database Integration (Future)
To integrate with the database backend:

1. **Add API endpoints** to `server.js`:
```javascript
// User login endpoint
app.post('/api/user/login', (req, res) => {
    // Handle user authentication
});

// Save credential endpoint
app.post('/api/credentials', (req, res) => {
    // Handle credential saving
});

// Get user credentials endpoint
app.get('/api/credentials/user/:userId', (req, res) => {
    // Handle credential retrieval
});
```

2. **Use the integration script** (`extension-integration.js`):
```javascript
const kryptoLockIntegration = new KryptoLockIntegration();

// Authenticate user
await kryptoLockIntegration.authenticateUser(username, password);

// Save credential
await kryptoLockIntegration.saveCredential(websiteName, websiteUrl, username, encryptedPassword);
```

## 🛡️ Security Features

### Extension Security
- **AES-256-GCM Encryption**: Industry-standard encryption
- **PBKDF2 Key Derivation**: 100,000 iterations
- **Local Storage**: No external data transmission
- **Session Management**: Auto-logout for security

### Admin Panel Security
- **bcrypt Password Hashing**: Secure password storage
- **Rate Limiting**: Protection against brute force
- **CORS Protection**: Secure cross-origin requests
- **Input Validation**: All inputs sanitized
- **Admin Authentication**: Secure admin-only access

## 🧩 Troubleshooting

### Server Issues
```bash
# Check if port 3000 is available
netstat -an | findstr :3000

# Kill process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Change port in config.env
PORT=3001
```

### Database Issues
```bash
# Reinitialize database
npm run init-db

# Check database file
ls -la database/

# Reset database (delete and recreate)
rm database/kryptolock.db
npm run init-db
```

### Extension Issues
- **Extension not loading**: Check manifest.json syntax
- **Auto-fill not working**: Check content script permissions
- **Storage issues**: Clear Chrome extension data

### Admin Panel Issues
- **Login fails**: Check admin credentials in config.env
- **Database errors**: Run `npm run init-db`
- **Permission errors**: Check database directory permissions

## 📊 API Endpoints

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/credentials` - Get all credentials
- `DELETE /api/admin/credentials/:id` - Delete credential
- `GET /api/admin/stats` - Get statistics

### Health Check
- `GET /api/health` - Server health status

## 🚀 Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run init-db    # Initialize database
```

### File Structure
```
KryptoLock/
├── server.js                  # Main server file
├── package.json              # Dependencies
├── config.env                # Environment variables
├── database/                 # SQLite database
├── public/                   # Admin panel files
│   ├── admin.html           # Admin interface
│   └── admin.js             # Admin logic
├── scripts/                  # Utility scripts
│   └── init-database.js     # Database setup
└── [Chrome extension files]  # Original extension
```

## 🔄 Updates and Maintenance

### Regular Maintenance
1. **Backup Database**: Copy `database/kryptolock.db`
2. **Update Dependencies**: `npm update`
3. **Check Logs**: Monitor server logs for errors
4. **Security Updates**: Keep Node.js and dependencies updated

### Adding New Features
1. **Backend**: Add endpoints to `server.js`
2. **Frontend**: Update `public/admin.html` and `public/admin.js`
3. **Database**: Add new tables/columns as needed
4. **Extension**: Update extension files for new functionality

## 📞 Support

### Common Issues
- **Port conflicts**: Change PORT in config.env
- **Database locked**: Restart server
- **Extension not working**: Check Chrome developer console
- **Admin panel issues**: Check browser console for errors

### Getting Help
1. Check the troubleshooting section
2. Review server logs
3. Check browser console for errors
4. Verify all files are in correct locations

---

## 🎉 Congratulations!

You now have a complete password management system with:
- ✅ Secure Chrome extension
- ✅ Database storage
- ✅ Admin panel
- ✅ User management
- ✅ Credential management
- ✅ Modern UI/UX

The system is ready for production use with proper security configurations! 