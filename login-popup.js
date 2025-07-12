// KryptoLock Login Popup
// Handles user authentication with the database backend

const API_BASE_URL = 'http://localhost:3000/api';

// Global variables
let currentMode = 'login';

// Initialize the popup
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Setup form event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Set initial mode
    switchMode('login');
});

// Check if user is already authenticated
function checkAuthStatus() {
    chrome.storage.local.get(['kryptolock_user_token', 'kryptolock_user_data'], function(result) {
        if (result.kryptolock_user_token && result.kryptolock_user_data) {
            // User is logged in, redirect to main popup
            window.location.href = 'popup.html';
        }
    });
}

// Switch between login and register modes
function switchMode(mode) {
    currentMode = mode;
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginModeBtn');
    const registerBtn = document.getElementById('registerModeBtn');
    
    if (mode === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginBtn.style.fontWeight = 'bold';
        registerBtn.style.fontWeight = 'normal';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        loginBtn.style.fontWeight = 'normal';
        registerBtn.style.fontWeight = 'bold';
    }
    
    // Clear any existing messages
    hideMessage();
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showMessage('Please enter both username and password', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user data and token
            chrome.storage.local.set({
                'kryptolock_user_token': data.token,
                'kryptolock_user_data': data.user
            }, function() {
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'popup.html';
                }, 1000);
            });
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please check your connection.', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 8) {
        showMessage('Password must be at least 8 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.message) {
            showMessage('Registration successful! You can now login.', 'success');
            // Clear form and switch to login mode
            document.getElementById('registerForm').reset();
            setTimeout(() => {
                switchMode('login');
            }, 2000);
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please check your connection.', 'error');
    } finally {
        showLoading(false);
    }
}

// Show message to user
function showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideMessage();
        }, 3000);
    }
}

// Hide message
function hideMessage() {
    const messageEl = document.getElementById('message');
    messageEl.style.display = 'none';
}

// Show/hide loading spinner
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (show) {
        loadingEl.style.display = 'block';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
    } else {
        loadingEl.style.display = 'none';
        if (currentMode === 'login') {
            loginForm.style.display = 'block';
        } else {
            registerForm.style.display = 'block';
        }
    }
}

// Test connection to server
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        return data.status === 'OK';
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}

// Check server connection on load
document.addEventListener('DOMContentLoaded', async function() {
    const isConnected = await testConnection();
    if (!isConnected) {
        showMessage('Cannot connect to server. Please ensure the admin server is running.', 'error');
    }
}); 