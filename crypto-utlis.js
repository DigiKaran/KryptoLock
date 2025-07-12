class CryptoUtils {
    static async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static async verifyPassword(password, hash) {
        const passwordHash = await this.hashPassword(password);
        return passwordHash === hash;
    }

    static async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    static async encrypt(plaintext, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);
        
        // Generate random salt and IV
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Derive key from password
        const key = await this.deriveKey(password, salt);
        
        // Encrypt data
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );
        
        // Combine salt, IV, and encrypted data
        const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        // Convert to base64 for storage
        return btoa(String.fromCharCode(...result));
    }

    static async decrypt(encryptedData, password) {
        // Convert from base64
        const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
        
        // Extract salt, IV, and encrypted data
        const salt = data.slice(0, 16);
        const iv = data.slice(16, 28);
        const encrypted = data.slice(28);
        
        // Derive key from password
        const key = await this.deriveKey(password, salt);
        
        // Decrypt data
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
        );
        
        // Convert back to string
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.CryptoUtils = CryptoUtils;
}