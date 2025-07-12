const fetch = require('node-fetch');

async function testAPI() {
    console.log('Testing KryptoLock Admin API...\n');

    // Test 1: Health check
    try {
        const healthResponse = await fetch('http://localhost:3000/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return;
    }

    // Test 2: Admin login
    try {
        const loginResponse = await fetch('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginResponse.json();
        console.log('✅ Admin login:', loginData);

        if (loginData.token) {
            const token = loginData.token;
            console.log('✅ Token received:', token);

            // Test 3: Get users
            try {
                const usersResponse = await fetch('http://localhost:3000/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const usersData = await usersResponse.json();
                console.log('✅ Get users:', usersData.length, 'users found');
            } catch (error) {
                console.log('❌ Get users failed:', error.message);
            }

            // Test 4: Get credentials
            try {
                const credsResponse = await fetch('http://localhost:3000/api/admin/credentials', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const credsData = await credsResponse.json();
                console.log('✅ Get credentials:', credsData.length, 'credentials found');
            } catch (error) {
                console.log('❌ Get credentials failed:', error.message);
            }

            // Test 5: Get stats
            try {
                const statsResponse = await fetch('http://localhost:3000/api/admin/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const statsData = await statsResponse.json();
                console.log('✅ Get stats:', statsData);
            } catch (error) {
                console.log('❌ Get stats failed:', error.message);
            }

            // Test 6: Create a test user
            try {
                const createUserResponse = await fetch('http://localhost:3000/api/admin/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        username: 'testuser',
                        email: 'test@example.com',
                        password: 'testpassword123',
                        is_admin: false
                    })
                });
                const createUserData = await createUserResponse.json();
                console.log('✅ Create user:', createUserData);
            } catch (error) {
                console.log('❌ Create user failed:', error.message);
            }

        } else {
            console.log('❌ No token received from login');
        }

    } catch (error) {
        console.log('❌ Admin login failed:', error.message);
    }
}

testAPI(); 