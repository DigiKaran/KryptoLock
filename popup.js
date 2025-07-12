class PasswordManager {
    constructor() {
        this.masterPassword = null;
        this.init();
    }

    async init() {
        await this.checkMasterPasswordSetup();
        this.bindEvents();
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
            const encryptedData = await CryptoUtils.encrypt(
                JSON.stringify({ username, password }),
                this.masterPassword
            );

            const result = await chrome.storage.local.get(['passwords']);
            const passwords = result.passwords || [];
            
            // Check if password already exists for this site
            const existingIndex = passwords.findIndex(p => p.siteUrl === siteUrl);
            
            const passwordEntry = {
                id: Date.now().toString(),
                siteName,
                siteUrl,
                encryptedData,
                createdAt: new Date().toISOString()
            };

            if (existingIndex !== -1) {
                passwords[existingIndex] = passwordEntry;
                this.showMessage('Password updated successfully!', 'success');
            } else {
                passwords.push(passwordEntry);
                this.showMessage('Password added successfully!', 'success');
            }

            await chrome.storage.local.set({ passwords });
            
            // Clear form
            document.getElementById('siteName').value = '';
            document.getElementById('siteUrl').value = '';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            
            await this.loadPasswords();
            this.autoFillCurrentSite();
        } catch (error) {
            this.showMessage('Error adding password', 'error');
        }
    }

    async loadPasswords() {
        const result = await chrome.storage.local.get(['passwords']);
        const passwords = result.passwords || [];
        
        const passwordList = document.getElementById('passwordList');
        const emptyState = document.getElementById('emptyState');

        if (passwords.length === 0) {
            passwordList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        passwordList.innerHTML = '';

        for (const passwordEntry of passwords) {
            const div = document.createElement('div');
            div.className = 'password-item';
            
            div.innerHTML = `
                <div class="password-info">
                    <div class="password-site">${passwordEntry.siteName}</div>
                    <div class="password-username">${passwordEntry.siteUrl}</div>
                </div>
                <div class="password-actions">
                    <button class="btn btn-small btn-secondary" onclick="passwordManager.fillPassword('${passwordEntry.id}')">Fill</button>
                    <button class="btn btn-small btn-secondary" onclick="passwordManager.copyPassword('${passwordEntry.id}')">Copy</button>
                    <button class="btn btn-small btn-danger" onclick="passwordManager.deletePassword('${passwordEntry.id}')">Delete</button>
                </div>
            `;
            
            passwordList.appendChild(div);
        }
    }

    async copyPassword(passwordId) {
        try {
            const result = await chrome.storage.local.get(['passwords']);
            const passwords = result.passwords || [];
            const passwordEntry = passwords.find(p => p.id === passwordId);
            
            if (passwordEntry) {
                const decryptedData = await CryptoUtils.decrypt(passwordEntry.encryptedData, this.masterPassword);
                const { password } = JSON.parse(decryptedData);
                
                await navigator.clipboard.writeText(password);
                this.showMessage('Password copied to clipboard!', 'success');
            }
        } catch (error) {
            this.showMessage('Error copying password', 'error');
        }
    }

    async fillPassword(passwordId) {
        try {
            const result = await chrome.storage.local.get(['passwords']);
            const passwords = result.passwords || [];
            const passwordEntry = passwords.find(p => p.id === passwordId);
            
            if (passwordEntry) {
                const decryptedData = await CryptoUtils.decrypt(passwordEntry.encryptedData, this.masterPassword);
                const { username, password } = JSON.parse(decryptedData);
                
                // Get current active tab
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                if (tab) {
                    // Send message to content script to fill the credentials
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
            const result = await chrome.storage.local.get(['passwords']);
            const passwords = result.passwords || [];
            const filteredPasswords = passwords.filter(p => p.id !== passwordId);
            
            await chrome.storage.local.set({ passwords: filteredPasswords });
            this.showMessage('Password deleted successfully!', 'success');
            await this.loadPasswords();
        } catch (error) {
            this.showMessage('Error deleting password', 'error');
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
        await chrome.storage.local.set({ isLoggedIn: false });
        this.masterPassword = null;
        this.showMasterPasswordLogin();
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