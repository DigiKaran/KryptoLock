// Import crypto utilities
importScripts('crypto-utlis.js');

class BackgroundManager {
    constructor() {
        this.init();
    }

    init() {
        // Listen for messages from content script and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'decryptPassword') {
                this.handleDecryptPassword(request, sendResponse);
                return true; // Keep the message channel open for async response
            }
        });

        // Clear login status on browser startup
        chrome.runtime.onStartup.addListener(() => {
            chrome.storage.local.set({ isLoggedIn: false });
        });

        // Clear login status when extension is installed/updated
        chrome.runtime.onInstalled.addListener(() => {
            chrome.storage.local.set({ isLoggedIn: false });
        });
    }

    async handleDecryptPassword(request, sendResponse) {
        try {
            // Check if user is logged in
            const result = await chrome.storage.local.get(['passwords', 'isLoggedIn']);
            
            if (!result.isLoggedIn) {
                sendResponse({ success: false, error: 'Not logged in' });
                return;
            }

            // Find the password entry
            const passwords = result.passwords || [];
            const passwordEntry = passwords.find(p => p.id === request.passwordId);
            
            if (!passwordEntry) {
                sendResponse({ success: false, error: 'Password not found' });
                return;
            }

            // We need the master password to decrypt, but we don't store it in background
            // So we'll need to handle this differently - the popup will handle decryption
            // and send the decrypted data to content script directly
            
            sendResponse({ success: false, error: 'Decryption must be handled by popup' });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
}

// Initialize the background manager
new BackgroundManager();