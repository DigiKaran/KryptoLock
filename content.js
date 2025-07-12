class AutoFillManager {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // Wait for page to load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.checkForLoginForms());
            } else {
                this.checkForLoginForms();
            }

            // Listen for messages from popup
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === 'fillCredentials') {
                    this.fillCredentials(request.username, request.password);
                    sendResponse({ success: true });
                }
            });

            // Listen for form submissions to auto-catch credentials
            document.addEventListener('submit', (e) => this.handleFormSubmit(e), true);
        } catch (error) {
            console.log('KryptoLock: Error in init:', error);
        }
    }

    async handleFormSubmit(e) {
        const form = e.target;
        const passwordField = form.querySelector('input[type="password"]');
        if (!passwordField) return;
        const usernameField = form.querySelector('input[type="text"], input[type="email"]');
        if (!usernameField) return;
        const username = usernameField.value;
        const password = passwordField.value;
        if (!username || !password) return;
        // Prompt to save credentials
        if (confirm(`Save credentials for ${window.location.hostname}?`)) {
            // Save to chrome.storage.local (append to passwords array)
            chrome.storage.local.get(['passwords'], (result) => {
                const passwords = result.passwords || [];
                passwords.push({
                    id: Date.now(),
                    siteUrl: window.location.href,
                    username,
                    password
                });
                chrome.storage.local.set({ passwords }, () => {
                    alert('Credentials saved!');
                });
            });
        }
    }

    async checkForLoginForms() {
        const loginForms = this.findLoginForms();
        
        if (loginForms.length > 0) {
            await this.tryAutoFill(loginForms[0]);
        } else {
            // Feedback if no login form found
            // console.log('KryptoLock: No login form detected on this page.');
        }
    }

    findLoginForms() {
        const forms = [];
        
        // Find forms with password fields
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        passwordFields.forEach(passwordField => {
            const form = passwordField.closest('form') || document.body;
            const usernameField = this.findUsernameField(form, passwordField);
            
            if (usernameField) {
                forms.push({
                    form: form,
                    usernameField: usernameField,
                    passwordField: passwordField
                });
            }
        });
        
        return forms;
    }

    findUsernameField(container, passwordField) {
        // Common selectors for username fields
        const usernameSelectors = [
            'input[type="email"]',
            'input[type="text"][name*="user"]',
            'input[type="text"][name*="email"]',
            'input[type="text"][name*="login"]',
            'input[type="text"][id*="user"]',
            'input[type="text"][id*="email"]',
            'input[type="text"][id*="login"]',
            'input[type="text"][placeholder*="email"]',
            'input[type="text"][placeholder*="username"]',
            'input[type="text"][placeholder*="user"]'
        ];

        // Try to find username field in the same container
        for (const selector of usernameSelectors) {
            const field = container.querySelector(selector);
            if (field && field !== passwordField) {
                return field;
            }
        }

        // If no specific username field found, try to find any text input before password field
        const allInputs = container.querySelectorAll('input[type="text"], input[type="email"]');
        for (const input of allInputs) {
            if (input.compareDocumentPosition(passwordField) & Node.DOCUMENT_POSITION_FOLLOWING) {
                return input;
            }
        }

        return null;
    }

    async tryAutoFill(loginForm) {
        const currentUrl = window.location.href;
        const domain = window.location.hostname;

        try {
            // Get stored passwords
            const result = await chrome.storage.local.get(['passwords', 'isLoggedIn']);
            
            if (!result.isLoggedIn || !result.passwords) {
                return;
            }

            // Find matching password entry
            const matchingPassword = result.passwords.find(p => {
                const storedUrl = new URL(p.siteUrl);
                return storedUrl.hostname === domain || p.siteUrl === currentUrl;
            });

            if (matchingPassword) {
                // Add visual indicator that autofill is available
                this.addAutoFillIndicator(loginForm);
            }
        } catch (error) {
            console.log('Error checking for autofill:', error);
        }
    }

    addAutoFillIndicator(loginForm) {
        // Add a small indicator to show autofill is available
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #667eea;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        indicator.textContent = '🔐 Click to autofill';
        indicator.id = 'securepass-indicator';

        // Remove existing indicator if any
        const existing = document.getElementById('securepass-indicator');
        if (existing) {
            existing.remove();
        }

        document.body.appendChild(indicator);

        // Add click handler to fill credentials
        indicator.addEventListener('click', async () => {
            await this.performAutoFill(loginForm);
            indicator.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.getElementById('securepass-indicator')) {
                indicator.remove();
            }
        }, 5000);
    }

    async performAutoFill(loginForm) {
        const currentUrl = window.location.href;
        const domain = window.location.hostname;

        try {
            const result = await chrome.storage.local.get(['passwords']);
            
            if (!result.passwords) {
                return;
            }

            // Find matching password entry
            const matchingPassword = result.passwords.find(p => {
                const storedUrl = new URL(p.siteUrl);
                return storedUrl.hostname === domain || p.siteUrl === currentUrl;
            });

            if (matchingPassword) {
                // Request decryption from background script
                chrome.runtime.sendMessage({
                    action: 'decryptPassword',
                    passwordId: matchingPassword.id
                }, (response) => {
                    if (response && response.success) {
                        this.fillCredentials(response.username, response.password);
                    }
                });
            }
        } catch (error) {
            console.log('Error performing autofill:', error);
        }
    }

    fillCredentials(username, password) {
        const loginForms = this.findLoginForms();
        
        if (loginForms.length > 0) {
            const { usernameField, passwordField } = loginForms[0];
            
            // Fill username field
            if (usernameField && username) {
                usernameField.value = username;
                usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                usernameField.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Fill password field
            if (passwordField && password) {
                passwordField.value = password;
                passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                passwordField.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Show success indicator
            this.showFillSuccess();
        }
    }

    showFillSuccess() {
        const successIndicator = document.createElement('div');
        successIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #48bb78;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        successIndicator.textContent = '✅ Credentials filled!';

        document.body.appendChild(successIndicator);

        setTimeout(() => {
            successIndicator.remove();
        }, 2000);
    }
}

// Initialize the autofill manager
try {
    new AutoFillManager();
} catch (error) {
    console.log('KryptoLock: Error initializing autofill manager:', error);
}