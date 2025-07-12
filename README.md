<p align="center">
  <img src="icon.png" alt="KryptoLock Icon" width="64" height="64" />
</p>

# 🔒 KryptoLock - Chrome Extension with Admin Panel

A secure password manager Chrome extension that stores passwords locally with master password encryption, now featuring a comprehensive admin panel for user and credential management.

## ✨ Features

### Chrome Extension
- 🔐 **Secure Encryption**: All passwords are encrypted using AES-256-GCM with PBKDF2 key derivation
- 🛡️ **Master Password Protection**: Single master password protects all stored credentials
- ⚡ **Auto-fill Functionality**: Automatically detects and fills login forms on websites
- 💾 **Local Storage**: All data is stored locally using Chrome's storage API
- 🎨 **Modern UI**: Clean, responsive interface with gradient design
- 🗝️ **Password Management**: Add, view, copy, and delete saved passwords
- ⏰ **Auto-logout**: Session management for enhanced security

### Admin Panel
- 👥 **User Management**: Create, edit, and delete users with admin privileges
- 🔑 **Credential Management**: View and manage all stored credentials across users
- 📊 **Dashboard Statistics**: Real-time overview of users and credentials
- 🔍 **Search & Filter**: Powerful search functionality for users and credentials
- 🎨 **Modern Admin UI**: Beautiful, responsive admin interface
- 🔒 **Secure Authentication**: Admin-only access with encrypted passwords
- 📱 **Mobile Responsive**: Works perfectly on all devices

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Chrome browser

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run init-db
```

### 3. Start the Admin Server
```bash
npm start
```

### 4. Load Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select your `KryptoLock` folder
4. The extension should now appear in your extensions list

## 📁 File Structure

```text
KryptoLock/
├── manifest.json              # Chrome extension manifest
├── popup.html                 # Extension popup interface
├── popup.js                   # Extension popup logic
├── crypto-utlis.js            # Encryption utilities
├── content.js                 # Content script for auto-fill
├── background.js              # Background script
├── server.js                  # Admin panel server
├── package.json               # Node.js dependencies
├── config.env                 # Environment configuration
├── database/                  # SQLite database directory
│   └── kryptolock.db         # Database file (created automatically)
├── public/                    # Admin panel static files
│   ├── admin.html            # Admin panel interface
│   └── admin.js              # Admin panel logic
├── scripts/                   # Utility scripts
│   └── init-database.js      # Database initialization
├── icons/                     # Extension icons
│   ├── icon-48.png
│   └── icon-128.png
├── icon.png                   # Main extension icon
└── README.md                  # This file
```

## 🛠️ Usage

### Admin Panel Access
1. Start the server: `npm start`
2. Open your browser and go to: `http://localhost:3000/admin`
3. Login with default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

### Admin Panel Features

#### Dashboard
- View total number of users and credentials
- Real-time statistics
- Quick navigation to user and credential management

#### User Management
- **View Users**: See all registered users with their details
- **Add User**: Create new users with admin privileges
- **Edit User**: Modify user information and permissions
- **Delete User**: Remove users (with confirmation)
- **Search Users**: Filter users by username or email

#### Credential Management
- **View Credentials**: See all stored credentials across users
- **Delete Credentials**: Remove specific credentials
- **Search Credentials**: Filter by website, username, or user
- **User Association**: See which user owns each credential

### Chrome Extension Usage

#### 🏁 First Time Setup
1. Click the KryptoLock icon in your Chrome toolbar
2. Set up your master password (minimum 8 characters)
3. Confirm your master password
4. Your extension is now ready to use!

#### ➕ Adding Passwords
1. Open the extension popup
2. Navigate to the "Add Password" tab
3. Fill in the website details:
   - Website Name (e.g., "Gmail")
   - Website URL (auto-filled if you're on the site)
   - Username/Email
   - Password
4. Click "Add Password"

#### 🤖 Using Auto-fill
1. Visit a website where you've saved credentials
2. Look for the blue "🔐 Click to autofill" indicator in the top-right corner
3. Click the indicator to automatically fill your login credentials
4. Or use the "Fill" button from the extension popup

#### 🗂️ Managing Passwords
- **View Passwords**: Go to the "View Passwords" tab to see all saved credentials
- **Copy Password**: Click the "Copy" button to copy a password to clipboard
- **Fill Password**: Click the "Fill" button to auto-fill credentials on the current page
- **Delete Password**: Click the "Delete" button to remove saved credentials

## 🔒 Security Features

### Extension Security
- **Session Management**: You'll need to enter your master password each time you start Chrome
- **Encryption**: All passwords are encrypted using industry-standard AES-256-GCM
- **Local Storage**: No data is sent to external servers
- **Auto-logout**: The extension logs out automatically for security

### Admin Panel Security
- **Password Hashing**: All passwords are hashed using bcrypt
- **Admin Authentication**: Secure admin-only access
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Secure cross-origin resource sharing
- **Input Validation**: All inputs are validated and sanitized

## 📝 Technical Details

### Extension
- **Encryption**: AES-256-GCM with PBKDF2 (100,000 iterations)
- **Storage**: Chrome's local storage API
- **Permissions**: Storage, active tab, and scripting permissions
- **Content Security**: No external scripts or resources loaded

### Admin Panel
- **Backend**: Node.js with Express.js
- **Database**: SQLite3 with foreign key constraints
- **Authentication**: bcrypt password hashing
- **Frontend**: Vanilla JavaScript with modern CSS
- **Security**: Helmet.js, CORS, rate limiting

## 🧩 Troubleshooting

### ❌ Extension Not Working
- Check that all files are in the correct directory structure
- Ensure both icon files are present and correctly sized
- Verify that developer mode is enabled in Chrome

### ⚠️ Auto-fill Not Working
- Make sure you're logged into the extension
- Check that the website URL matches your saved credentials
- Try refreshing the page after adding new credentials

### 🔑 Forgot Master Password
- Unfortunately, if you forget your master password, you'll need to reset the extension
- Go to `chrome://extensions/`, find KryptoLock, and click "Remove"
- Reinstall the extension (this will delete all saved passwords)

### 🖥️ Admin Panel Issues
- **Server won't start**: Check if port 3000 is available, or change it in `config.env`
- **Database errors**: Run `npm run init-db` to reinitialize the database
- **Login issues**: Default admin credentials are `admin` / `admin123`
- **Permission errors**: Ensure the `database` directory is writable

## 👨‍💻 Development

### Available Scripts
```bash
npm start          # Start the admin server
npm run dev        # Start with nodemon for development
npm run init-db    # Initialize database with sample data
```

### Environment Variables
Create a `config.env` file with:
```env
PORT=3000
ADMIN_PASSWORD=your-secure-admin-password
DB_PATH=./database/kryptolock.db
SESSION_SECRET=your-super-secret-session-key
```

### API Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/credentials` - Get all credentials
- `DELETE /api/admin/credentials/:id` - Delete credential
- `GET /api/admin/stats` - Get dashboard statistics

## 📄 License

This extension is provided as-is for educational and personal use.

## 💬 Support

For issues or questions, please check the troubleshooting section above or create an issue in the repository.