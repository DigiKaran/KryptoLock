// Simple test for admin functionality
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function testAdmin() {
    console.log('Testing KryptoLock Admin Panel...\n');

    try {
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const health = await makeRequest('http://localhost:3000/api/health');
        console.log('✅ Health check:', health.data);

        // Test 2: Admin login
        console.log('\n2. Testing admin login...');
        const loginResponse = await makeRequest('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        console.log('✅ Login response:', loginResponse.data);

        if (loginResponse.data.token) {
            const token = loginResponse.data.token;
            console.log('✅ Token received:', token);

            // Test 3: Get users
            console.log('\n3. Testing get users...');
            const usersResponse = await makeRequest('http://localhost:3000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Users response:', usersResponse.data);

            // Test 4: Get stats
            console.log('\n4. Testing get stats...');
            const statsResponse = await makeRequest('http://localhost:3000/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Stats response:', statsResponse.data);

            // Test 5: Create a test user
            console.log('\n5. Testing create user...');
            const createUserResponse = await makeRequest('http://localhost:3000/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: 'testuser123',
                    email: 'test123@example.com',
                    password: 'testpassword123',
                    is_admin: false
                })
            });
            console.log('✅ Create user response:', createUserResponse.data);

        } else {
            console.log('❌ No token received from login');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAdmin(); 