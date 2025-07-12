const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const CryptoJS = require('crypto-js');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Test route for admin functions
app.get('/test-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-admin.html'));
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('./database/kryptolock.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Credentials table
    db.run(`CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      website_name TEXT NOT NULL,
      website_url TEXT NOT NULL,
      username TEXT NOT NULL,
      encrypted_password TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Create default admin user if not exists
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    bcrypt.hash(adminPassword, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing admin password:', err);
        return;
      }
      
      db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
        if (err) {
          console.error('Error checking admin user:', err);
          return;
        }
        
        if (!row) {
          db.run(`INSERT INTO users (username, email, password_hash, is_admin) 
                  VALUES (?, ?, ?, ?)`, 
                  ['admin', 'admin@kryptolock.com', hash, 1], 
                  (err) => {
            if (err) {
              console.error('Error creating admin user:', err);
            } else {
              console.log('Default admin user created');
              console.log('Username: admin');
              console.log('Password:', adminPassword);
            }
          });
        }
      });
    });
  });
}

// Admin authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Simple token validation (in production, use JWT)
  if (token === 'admin-token') {
    req.user = { id: 1, username: 'admin', is_admin: true };
    next();
  } else {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// User authentication middleware
function authenticateUserToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Parse user token (format: user-token-{userId}-{timestamp})
  const tokenParts = token.split('-');
  if (tokenParts.length < 3 || tokenParts[0] !== 'user' || tokenParts[1] !== 'token') {
    return res.status(403).json({ error: 'Invalid token format' });
  }

  const userId = parseInt(tokenParts[2]);
  if (isNaN(userId)) {
    return res.status(403).json({ error: 'Invalid user ID in token' });
  }

  // Get user from database
  db.get('SELECT id, username, email, is_admin FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  });
}

// API Routes

// User registration
app.post('/api/user/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Password hashing error' });
    }

    db.run(`INSERT INTO users (username, email, password_hash, is_admin) 
            VALUES (?, ?, ?, ?)`, 
            [username, email, hash, 0], 
            function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({ 
        message: 'User registered successfully',
        user_id: this.lastID 
      });
    });
  });
});

// User login
app.post('/api/user/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Authentication error' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate a simple token (in production, use JWT)
      const token = `user-token-${user.id}-${Date.now()}`;

      res.json({ 
        success: true,
        message: 'Login successful',
        token: token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          is_admin: user.is_admin
        }
      });
    });
  });
});

// Save user credential
app.post('/api/credentials', authenticateUserToken, (req, res) => {
  const { website_name, website_url, username, encrypted_password, notes } = req.body;
  const userId = req.user.id;

  if (!website_name || !website_url || !username || !encrypted_password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(`INSERT INTO credentials (user_id, website_name, website_url, username, encrypted_password, notes) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
          [userId, website_name, website_url, username, encrypted_password, notes || ''], 
          function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({ 
      message: 'Credential saved successfully',
      credential_id: this.lastID 
    });
  });
});

// Get user credentials
app.get('/api/credentials/user/:userId', authenticateUserToken, (req, res) => {
  const { userId } = req.params;

  // Check if user is requesting their own credentials or is admin
  if (req.user.id != userId && !req.user.is_admin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all('SELECT * FROM credentials WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, credentials) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(credentials);
  });
});

// Delete user credential
app.delete('/api/credentials/:id', authenticateUserToken, (req, res) => {
  const { id } = req.params;

  // First check if credential belongs to user or user is admin
  db.get('SELECT user_id FROM credentials WHERE id = ?', [id], (err, credential) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (credential.user_id != req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run('DELETE FROM credentials WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Credential deleted successfully' });
    });
  });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ? AND is_admin = 1', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Authentication error' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({ 
        message: 'Login successful',
        token: 'admin-token',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          is_admin: user.is_admin
        }
      });
    });
  });
});

// Get all users
app.get('/api/admin/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, email, is_admin, created_at, updated_at FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Create new user
app.post('/api/admin/users', authenticateToken, (req, res) => {
  const { username, email, password, is_admin } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Password hashing error' });
    }

    db.run(`INSERT INTO users (username, email, password_hash, is_admin) 
            VALUES (?, ?, ?, ?)`, 
            [username, email, hash, is_admin ? 1 : 0], 
            function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({ 
        message: 'User created successfully',
        user_id: this.lastID 
      });
    });
  });
});

// Update user
app.put('/api/admin/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { username, email, is_admin } = req.body;

  db.run(`UPDATE users SET username = ?, email = ?, is_admin = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?`, 
          [username, email, is_admin ? 1 : 0, id], 
          function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  });
});

// Delete user
app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

// Get all credentials
app.get('/api/admin/credentials', authenticateToken, (req, res) => {
  db.all(`SELECT c.*, u.username as user_username 
          FROM credentials c 
          JOIN users u ON c.user_id = u.id 
          ORDER BY c.created_at DESC`, (err, credentials) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(credentials);
  });
});

// Get credentials by user
app.get('/api/admin/credentials/user/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;

  db.all('SELECT * FROM credentials WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, credentials) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(credentials);
  });
});

// Delete credential
app.delete('/api/admin/credentials/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM credentials WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({ message: 'Credential deleted successfully' });
  });
});

// Dashboard statistics
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  db.get('SELECT COUNT(*) as total_users FROM users', (err, userCount) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.get('SELECT COUNT(*) as total_credentials FROM credentials', (err, credCount) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        total_users: userCount.total_users,
        total_credentials: credCount.total_credentials
      });
    });
  });
});

// Admin decrypt credential password
app.get('/api/admin/credentials/:id/decrypt', authenticateToken, (req, res) => {
  const credentialId = req.params.id;
  const masterPassword = process.env.ADMIN_MASTER_PASSWORD;
  console.log(`[DECRYPT] Endpoint hit for credentialId: ${credentialId}`);
  if (!masterPassword) {
    console.log('[DECRYPT] No master password set');
    return res.status(500).json({ error: 'Admin master password not set in environment.' });
  }
  db.get('SELECT encrypted_password FROM credentials WHERE id = ?', [credentialId], (err, row) => {
    if (err) {
      console.error('[DECRYPT] Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      console.log('[DECRYPT] Credential not found');
      return res.status(404).json({ error: 'Credential not found' });
    }
    try {
      console.log('[DECRYPT] Starting decryption logic');
      const encryptedData = row.encrypted_password;
      const data = Buffer.from(encryptedData, 'base64');
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);
      console.log('[DECRYPT] Salt:', salt.toString('hex'));
      console.log('[DECRYPT] IV:', iv.toString('hex'));
      console.log('[DECRYPT] Encrypted length:', encrypted.length);
      const ciphertext = encrypted.slice(0, -16);
      const authTag = encrypted.slice(-16);
      console.log('[DECRYPT] Ciphertext:', ciphertext.toString('hex'));
      console.log('[DECRYPT] AuthTag:', authTag.toString('hex'));
      // Derive key using PBKDF2 (same as browser)
      crypto.pbkdf2(masterPassword, salt, 100000, 32, 'sha256', (err, key) => {
        if (err) {
          console.error('[DECRYPT] PBKDF2 error:', err);
          return res.status(500).json({ error: 'PBKDF2 error' });
        }
        console.log('[DECRYPT] Derived key:', key.toString('hex'));
        try {
          console.log('[DECRYPT] Key derived, attempting AES-GCM decryption');
          const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
          decipher.setAuthTag(authTag);
          let decrypted = decipher.update(ciphertext);
          decrypted = Buffer.concat([decrypted, decipher.final()]);
          const password = decrypted.toString('utf8');
          console.log('[DECRYPT] Decryption successful:', password);
          res.json({ password });
        } catch (e) {
          console.error('[DECRYPT] Decryption failed:', e);
          res.status(400).json({ error: 'Decryption failed', details: e.message });
        }
      });
    } catch (e) {
      console.error('[DECRYPT] Decryption error:', e);
      res.status(500).json({ error: 'Decryption error', details: e.message });
    }
  });
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 KryptoLock Admin Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
}); 