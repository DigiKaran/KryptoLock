class PasswordManager {
    constructor() {
        this.masterPassword = null;
        this.userToken = null;
        this.userData = null;
        this.init();
    }

    async init() {
        // Check if user is authenticated with database
        await this.checkUserAuthentication();
        await this.checkMasterPasswordSetup();
        this.bindEvents();
    }

    async checkUserAuthentication() {
        const result = await chrome.storage.local.get(['kryptolock_user_token', 'kryptolock_user_data']);
        
        if (!result.kryptolock_user_token || !result.kryptolock_user_data) {
            // User not authenticated, redirect to login
            window.location.href = 'login-popup.html';
            return;
        }
        
        this.userToken = result.kryptolock_user_token;
        this.userData = result.kryptolock_user_data;
        
        // Display user info
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = `Logged in as: ${this.userData.username}`;
        }
    }

    async checkMasterPasswordSetup() {
        const result = await chrome.storage.local.get(['masterPasswordHash', 'isLoggedIn']);
        
        if (!result.masterPasswordHash) {
            this.showMasterPasswordSetup();
        } else if (result.isLoggedIn) {
            this.showMainInterface();
            await this.loadPasswords();
        } else {
            this.showMasterPasswordLogin();
        }
    }

    showMasterPasswordSetup() {
        document.getElementById('masterPasswordSetup').style.display = 'block';
        document.getElementById('masterPasswordLogin').style.display = 'none';
        document.getElementById('mainInterface').style.display = 'none';
    }

    showMasterPasswordLogin() {
        document.getElementById('masterPasswordSetup').style.display = 'none';
        document.getElementById('masterPasswordLogin').style.display = 'block';
        document.getElementById('mainInterface').style.display = 'none';
    }

    showMainInterface() {
        document.getElementById('masterPasswordSetup').style.display = 'none';
        document.getElementById('masterPasswordLogin').style.display = 'none';
        document.getElementById('mainInterface').style.display = 'block';
    }

    bindEvents() {
        // Master password setup
        document.getElementById('setMasterPasswordBtn').addEventListener('click', () => {
            this.setMasterPassword();
        });

        // Master password login
        document.getElementById('loginMasterPasswordBtn').addEventListener('click', () => {
            this.loginWithMasterPassword();
        });

        // Add password
        document.getElementById('addPasswordBtn').addEventListener('click', () => {
            this.addPassword();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Enter key handlers
        document.getElementById('setupMasterPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setMasterPassword();
        });

        document.getElementById('confirmMasterPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setMasterPassword();
        });

        document.getElementById('loginMasterPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loginWithMasterPassword();
        });

        // Auto-fill current site
        this.autoFillCurrentSite();
    }

    async autoFillCurrentSite() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                const url = new URL(tab.url);
                const domain = url.hostname;
                document.getElementById('siteUrl').value = tab.url;
                document.getElementById('siteName').value = domain.replace('www.', '');
            }
        } catch (error) {
            console.log('Could not auto-fill current site:', error);
        }
    }

    async setMasterPassword() {
        const password = document.getElementById('setupMasterPassword').value;
        const confirmPassword = document.getElementById('confirmMasterPassword').value;

        if (!password || !confirmPassword) {
            this.showMessage('Please enter and confirm your master password', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            this.showMessage('Master password must be at least 8 characters', 'error');
            return;
        }

        try {
            const hash = await CryptoUtils.hashPassword(password);
            await chrome.storage.local.set({ 
                masterPasswordHash: hash,
                isLoggedIn: true 
            });
            
            this.masterPassword = password;
            this.showMessage('Master password set successfully!', 'success');
            setTimeout(() => {
                this.showMainInterface();
                this.loadPasswords();
            }, 1000);
        } catch (error) {
            this.showMessage('Error setting master password', 'error');
        }
    }

    async loginWithMasterPassword() {
        const password = document.getElementById('loginMasterPassword').value;
        
        if (!password) {
            this.showMessage('Please enter your master password', 'error');
            return;
        }

        try {
            const result = await chrome.storage.local.get(['masterPasswordHash']);
            const isValid = await CryptoUtils.verifyPassword(password, result.masterPasswordHash);
            
            if (isValid) {
                this.masterPassword = password;
                await chrome.storage.local.set({ isLoggedIn: true });
                this.showMainInterface();
                await this.loadPasswords();
            } else {
                this.showMessage('Invalid master password', 'error');
            }
        } catch (error) {
            this.showMessage('Error verifying master password', 'error');
        }
    }

    async addPassword() {
        const siteName = document.getElementById('siteName').value;
        const siteUrl = document.getElementById('siteUrl').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!siteName || !siteUrl || !username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            // Encrypt the password with master password
            const encryptedPassword = await CryptoUtils.encrypt(password, this.masterPassword);

            // Save to database
            const response = await fetch('http://localhost:3000/api/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userToken}`
                },
                body: JSON.stringify({
                    website_name: siteName,
                    website_url: siteUrl,
                    username: username,
                    encrypted_password: encryptedPassword,
                    notes: 'Saved from KryptoLock extension'
                })
            });

            const data = await response.json();

            if (data.message) {
                this.showMessage('Password saved successfully!', 'success');
                
                // Clear form
                document.getElementById('siteName').value = '';
                document.getElementById('siteUrl').value = '';
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                
                // Reload passwords
                await this.loadPasswords();
                this.autoFillCurrentSite();
            } else {
                this.showMessage(data.error || 'Error saving password', 'error');
            }
        } catch (error) {
            console.error('Error adding password:', error);
            this.showMessage('Network error. Please check your connection.', 'error');
        }
    }

    async loadPasswords() {
        try {
            // Load passwords from database
            const response = await fetch(`http://localhost:3000/api/credentials/user/${this.userData.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.userToken}`
                }
            });

            const credentials = await response.json();
            
            const passwordList = document.getElementById('passwordList');
            const emptyState = document.getElementById('emptyState');

            if (credentials.length === 0) {
                passwordList.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';
            passwordList.innerHTML = '';

            for (const credential of credentials) {
                try {
                    // Decrypt the password
                    const decryptedPassword = await CryptoUtils.decrypt(credential.encrypted_password, this.masterPassword);
                    const div = document.createElement('div');
                    div.className = 'password-item';
                    div.innerHTML = `
                        <div class="password-info">
                            <div class="password-site">${credential.website_name}</div>
                            <div class="password-username">${credential.username}</div>
                        </div>
                        <div class="password-actions">
                            <button class="btn btn-small btn-secondary fill-btn" data-username="${credential.username}" data-password="${decryptedPassword}">Fill</button>
                            <button class="btn btn-small btn-secondary copy-btn" data-password="${decryptedPassword}">Copy</button>
                            <button class="btn btn-small btn-danger delete-btn" data-id="${credential.id}">Delete</button>
                        </div>
                    `;
                    passwordList.appendChild(div);
                } catch (error) {
                    console.error('Error decrypting password:', error);
                    // Show encrypted entry if decryption fails
                    const div = document.createElement('div');
                    div.className = 'password-item';
                    div.innerHTML = `
                        <div class="password-info">
                            <div class="password-site">${credential.website_name} (Encrypted)</div>
                            <div class="password-username">${credential.username}</div>
                        </div>
                        <div class="password-actions">
                            <button class="btn btn-small btn-danger" onclick="passwordManager.deletePassword('${credential.id}')">Delete</button>
                        </div>
                    `;
                    passwordList.appendChild(div);
                }
            }

            // Add event delegation for Fill, Copy, Delete
            passwordList.onclick = (e) => {
                const fillBtn = e.target.closest('.fill-btn');
                const copyBtn = e.target.closest('.copy-btn');
                const deleteBtn = e.target.closest('.delete-btn');
                if (fillBtn) {
                    this.handleFillButton(fillBtn);
                } else if (copyBtn) {
                    this.copyPassword(null, copyBtn.dataset.password);
                } else if (deleteBtn) {
                    this.deletePassword(deleteBtn.dataset.id);
                }
            };
        } catch (error) {
            console.error('Error loading passwords:', error);
            this.showMessage('Network error. Please check your connection.', 'error');
        }
    }

    async copyPassword(passwordId, decryptedPassword) {
        try {
            await navigator.clipboard.writeText(decryptedPassword);
            this.showMessage('Password copied to clipboard!', 'success');
        } catch (error) {
            this.showMessage('Error copying password', 'error');
        }
    }

    async handleFillButton(btn) {
        const username = btn.dataset.username;
        const password = btn.dataset.password;
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'fillCredentials',
                    username: username,
                    password: password
                }, (response) => {
                    if (response && response.success) {
                        this.showMessage('Credentials filled!', 'success');
                    } else {
                        this.showMessage('Could not fill credentials', 'error');
                    }
                });
            }
        } catch (error) {
            this.showMessage('Error filling password', 'error');
        }
    }

    async deletePassword(passwordId) {
        if (!confirm('Are you sure you want to delete this password?')) {
            return;
        }

        try {
            // Delete from database
            const response = await fetch(`http://localhost:3000/api/credentials/${passwordId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.userToken}`
                }
            });

            const data = await response.json();

            if (data.message) {
                this.showMessage('Password deleted successfully!', 'success');
                await this.loadPasswords();
            } else {
                this.showMessage(data.error || 'Error deleting password', 'error');
            }
        } catch (error) {
            console.error('Error deleting password:', error);
            this.showMessage('Network error. Please check your connection.', 'error');
        }
    }

    switchTab(tabName) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        if (tabName === 'view') {
            this.loadPasswords();
        }
    }

    async logout() {
        // Clear all authentication data
        await chrome.storage.local.remove([
            'isLoggedIn', 
            'masterPasswordHash', 
            'kryptolock_user_token', 
            'kryptolock_user_data'
        ]);
        
        this.masterPassword = null;
        this.userToken = null;
        this.userData = null;
        
        // Redirect to login page
        window.location.href = 'login-popup.html';
    }

    showMessage(message, type) {
        const messageContainer = document.getElementById('messageContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        messageContainer.innerHTML = '';
        messageContainer.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Initialize the password manager
const passwordManager = new PasswordManager();