// Extension Integration Script
// This file demonstrates how to integrate the Chrome extension with the database backend

class KryptoLockIntegration {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.userId = null;
        this.isAuthenticated = false;
    }

    // Authenticate user with the backend
    async authenticateUser(username, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.userId = data.user.id;
                this.isAuthenticated = true;
                localStorage.setItem('kryptolock_user_id', this.userId);
                localStorage.setItem('kryptolock_token', data.token);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Save credential to database
    async saveCredential(websiteName, websiteUrl, username, encryptedPassword, notes = '') {
        if (!this.isAuthenticated) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('kryptolock_token')}`
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    website_name: websiteName,
                    website_url: websiteUrl,
                    username: username,
                    encrypted_password: encryptedPassword,
                    notes: notes
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Save credential error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Get user's credentials from database
    async getCredentials() {
        if (!this.isAuthenticated) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/credentials/user/${this.userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('kryptolock_token')}`
                }
            });

            const data = await response.json();
            return { success: true, credentials: data };
        } catch (error) {
            console.error('Get credentials error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Delete credential from database
    async deleteCredential(credentialId) {
        if (!this.isAuthenticated) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/credentials/${credentialId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('kryptolock_token')}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Delete credential error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Register new user
    async registerUser(username, email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Check if user is authenticated
    checkAuthStatus() {
        const token = localStorage.getItem('kryptolock_token');
        const userId = localStorage.getItem('kryptolock_user_id');
        
        if (token && userId) {
            this.userId = userId;
            this.isAuthenticated = true;
            return true;
        }
        return false;
    }

    // Logout user
    logout() {
        this.userId = null;
        this.isAuthenticated = false;
        localStorage.removeItem('kryptolock_user_id');
        localStorage.removeItem('kryptolock_token');
    }
}

// Example usage in Chrome extension
// Add this to your popup.js or background.js

/*
// Initialize integration
const kryptoLockIntegration = new KryptoLockIntegration();

// Check if user is already authenticated
if (kryptoLockIntegration.checkAuthStatus()) {
    console.log('User is authenticated');
} else {
    console.log('User needs to login');
}

// Example: Save a credential
async function savePasswordToDatabase(websiteName, websiteUrl, username, password) {
    // First encrypt the password using your existing crypto utilities
    const encryptedPassword = await encryptPassword(password, masterPassword);
    
    const result = await kryptoLockIntegration.saveCredential(
        websiteName,
        websiteUrl,
        username,
        encryptedPassword,
        'Saved from Chrome extension'
    );
    
    if (result.success) {
        console.log('Credential saved to database');
    } else {
        console.error('Failed to save credential:', result.error);
    }
}

// Example: Get user's credentials
async function loadCredentialsFromDatabase() {
    const result = await kryptoLockIntegration.getCredentials();
    
    if (result.success) {
        // Decrypt passwords and display them
        result.credentials.forEach(credential => {
            const decryptedPassword = await decryptPassword(
                credential.encrypted_password, 
                masterPassword
            );
            // Display credential in extension UI
        });
    } else {
        console.error('Failed to load credentials:', result.error);
    }
}
*/

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KryptoLockIntegration;
} 