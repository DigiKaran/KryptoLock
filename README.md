<p align="center">
  <img src="icon.png" alt="KryptoLock Icon" width="64" height="64" />
</p>

# 🔒 KryptoLock - Chrome Extension

A secure password manager Chrome extension that stores passwords locally with master password encryption.

## ✨ Features

- 🔐 **Secure Encryption**: All passwords are encrypted using AES-256-GCM with PBKDF2 key derivation
- 🛡️ **Master Password Protection**: Single master password protects all stored credentials
- ⚡ **Auto-fill Functionality**: Automatically detects and fills login forms on websites
- 💾 **Local Storage**: All data is stored locally using Chrome's storage API
- 🎨 **Modern UI**: Clean, responsive interface with gradient design
- 🗝️ **Password Management**: Add, view, copy, and delete saved passwords
- ⏰ **Auto-logout**: Session management for enhanced security

## 🚀 Installation

1. **Download the Extension Files**
   - Save all the provided files in a folder named `kryptolock`
   - Create an `icons` folder inside the main folder

2. **Create the Icon Files**
   - Use the provided SVG template to create two PNG icons:
     - `icons/icon-48.png` (48×48 pixels)
     - `icons/icon-128.png` (128×128 pixels)
   - Use the SVG code provided to generate these icons

3. **Load the Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select your `kryptolock` folder
   - The extension should now appear in your extensions list

## 📁 File Structure

```text
kryptolock/
├── manifest.json
├── popup.html
├── popup.js
├── crypto-utlis.js
├── content.js
├── background.js
├── icons/
│   ├── icon-48.png
│   └── icon-128.png
├── icon.png
└── README.md
```

## 🛠️ Usage

### 🏁 First Time Setup

1. Click the KryptoLock icon in your Chrome toolbar
2. Set up your master password (minimum 8 characters)
3. Confirm your master password
4. Your extension is now ready to use!

### ➕ Adding Passwords

1. Open the extension popup
2. Navigate to the "Add Password" tab
3. Fill in the website details:
   - Website Name (e.g., "Gmail")
   - Website URL (auto-filled if you're on the site)
   - Username/Email
   - Password
4. Click "Add Password"

### 🤖 Using Auto-fill

1. Visit a website where you've saved credentials
2. Look for the blue "🔐 Click to autofill" indicator in the top-right corner
3. Click the indicator to automatically fill your login credentials
4. Or use the "Fill" button from the extension popup

### 🗂️ Managing Passwords

- **View Passwords**: Go to the "View Passwords" tab to see all saved credentials
- **Copy Password**: Click the "Copy" button to copy a password to clipboard
- **Fill Password**: Click the "Fill" button to auto-fill credentials on the current page
- **Delete Password**: Click the "Delete" button to remove saved credentials

## 🔒 Security Features

- **Session Management**: You'll need to enter your master password each time you start Chrome
- **Encryption**: All passwords are encrypted using industry-standard AES-256-GCM
- **Local Storage**: No data is sent to external servers
- **Auto-logout**: The extension logs out automatically for security

## 📝 Technical Details

- **Encryption**: AES-256-GCM with PBKDF2 (100,000 iterations)
- **Storage**: Chrome's local storage API
- **Permissions**: Storage, active tab, and scripting permissions
- **Content Security**: No external scripts or resources loaded

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

## 👨‍💻 Development

This extension uses:
- Manifest V3 for modern Chrome extension architecture
- Web Crypto API for encryption
- Chrome Storage API for local data persistence
- Content Scripts for auto-fill functionality

## 📄 License

This extension is provided as-is for educational and personal use.

## 💬 Support

For issues or questions, please check the troubleshooting section above.