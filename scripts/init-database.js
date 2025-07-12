const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Database setup
const dbPath = path.join(__dirname, '..', 'database', 'kryptolock.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    console.log('Initializing database...');
    
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
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table created successfully');
            }
        });

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
        )`, (err) => {
            if (err) {
                console.error('Error creating credentials table:', err.message);
            } else {
                console.log('Credentials table created successfully');
            }
        });

        // Create default admin user
        createDefaultAdmin();
        
        // Create sample users and credentials
        setTimeout(() => {
            createSampleData();
        }, 1000);
    });
}

function createDefaultAdmin() {
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
                        console.log('✅ Default admin user created');
                        console.log('   Username: admin');
                        console.log('   Password:', adminPassword);
                    }
                });
            } else {
                console.log('✅ Admin user already exists');
            }
        });
    });
}

function createSampleData() {
    // Create sample users
    const sampleUsers = [
        { username: 'john_doe', email: 'john@example.com', password: 'password123', is_admin: false },
        { username: 'jane_smith', email: 'jane@example.com', password: 'password123', is_admin: false },
        { username: 'bob_wilson', email: 'bob@example.com', password: 'password123', is_admin: false }
    ];

    let usersCreated = 0;
    
    sampleUsers.forEach((user, index) => {
        bcrypt.hash(user.password, 10, (err, hash) => {
            if (err) {
                console.error(`Error hashing password for ${user.username}:`, err);
                return;
            }
            
            db.run(`INSERT OR IGNORE INTO users (username, email, password_hash, is_admin) 
                    VALUES (?, ?, ?, ?)`, 
                    [user.username, user.email, hash, user.is_admin], 
                    function(err) {
                if (err) {
                    console.error(`Error creating user ${user.username}:`, err);
                } else {
                    if (this.changes > 0) {
                        console.log(`✅ Created user: ${user.username}`);
                        usersCreated++;
                        
                        // Create sample credentials for this user
                        createSampleCredentials(this.lastID, user.username);
                    } else {
                        console.log(`ℹ️  User ${user.username} already exists`);
                    }
                }
                
                // Check if all users are processed
                if (index === sampleUsers.length - 1) {
                    console.log(`\n📊 Database initialization complete!`);
                    console.log(`   - ${usersCreated} new users created`);
                    console.log(`   - Sample credentials added`);
                    console.log(`\n🚀 You can now start the server with: npm start`);
                    console.log(`📊 Access admin panel at: http://localhost:3000/admin`);
                    
                    db.close((err) => {
                        if (err) {
                            console.error('Error closing database:', err.message);
                        } else {
                            console.log('Database connection closed.');
                        }
                        process.exit(0);
                    });
                }
            });
        });
    });
}

function createSampleCredentials(userId, username) {
    const sampleCredentials = [
        {
            website_name: 'Gmail',
            website_url: 'https://gmail.com',
            username: username + '@gmail.com',
            encrypted_password: 'encrypted_password_123',
            notes: 'Personal email account'
        },
        {
            website_name: 'GitHub',
            website_url: 'https://github.com',
            username: username,
            encrypted_password: 'encrypted_password_456',
            notes: 'Code repository access'
        },
        {
            website_name: 'LinkedIn',
            website_url: 'https://linkedin.com',
            username: username + '@linkedin.com',
            encrypted_password: 'encrypted_password_789',
            notes: 'Professional networking'
        }
    ];

    sampleCredentials.forEach(credential => {
        db.run(`INSERT INTO credentials (user_id, website_name, website_url, username, encrypted_password, notes) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
                [userId, credential.website_name, credential.website_url, credential.username, credential.encrypted_password, credential.notes], 
                (err) => {
            if (err) {
                console.error(`Error creating credential for ${username}:`, err);
            } else {
                console.log(`   📝 Added credential: ${credential.website_name}`);
            }
        });
    });
}

// Handle process termination
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