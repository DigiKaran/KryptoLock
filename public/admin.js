// Global variables
let authToken = localStorage.getItem('adminToken');
let currentUsers = [];
let currentCredentials = [];
let editingUserId = null;

// Debug: Check if functions are available
console.log('KryptoLock Admin: Script loaded');
console.log('Available functions:', {
    handleLogin: typeof window.handleLogin,
    logout: typeof window.logout,
    openUserModal: typeof window.openUserModal,
    closeUserModal: typeof window.closeUserModal,
    deleteUser: typeof window.deleteUser,
    editUser: typeof window.editUser
});

// Helper functions (not exposed globally)
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function loadStats() {
    fetch('/api/admin/stats', {
        headers: {
            'Authorization': 'Bearer ' + authToken
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('totalUsers').textContent = data.total_users;
        document.getElementById('totalCredentials').textContent = data.total_credentials;
    })
    .catch(error => {
        console.error('Error loading stats:', error);
    });
}

function loadUsers() {
    const loading = document.getElementById('usersLoading');
    const tableBody = document.getElementById('usersTableBody');
    
    loading.style.display = 'block';
    tableBody.innerHTML = '';

    fetch('/api/admin/users', {
        headers: {
            'Authorization': 'Bearer ' + authToken
        }
    })
    .then(response => response.json())
    .then(users => {
        currentUsers = users;
        displayUsers(users);
        loading.style.display = 'none';
    })
    .catch(error => {
        console.error('Error loading users:', error);
        loading.style.display = 'none';
        showAlert('Error loading users', 'error');
    });
}

function loadCredentials() {
    const loading = document.getElementById('credentialsLoading');
    const tableBody = document.getElementById('credentialsTableBody');
    
    loading.style.display = 'block';
    tableBody.innerHTML = '';

    fetch('/api/admin/credentials', {
        headers: {
            'Authorization': 'Bearer ' + authToken
        }
    })
    .then(response => response.json())
    .then(credentials => {
        currentCredentials = credentials;
        displayCredentials(credentials);
        loading.style.display = 'none';
    })
    .catch(error => {
        console.error('Error loading credentials:', error);
        loading.style.display = 'none';
        showAlert('Error loading credentials', 'error');
    });
}

function displayUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>
                <strong>${user.username}</strong>
                ${user.is_admin ? '<span style="background: #48bb78; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px;">ADMIN</span>' : ''}
            </td>
            <td>${user.email}</td>
            <td>${user.is_admin ? '<span style="color: #48bb78; font-weight: bold;">✓</span>' : '<span style="color: #718096;">✗</span>'}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <button class="btn btn-primary view-credentials-btn" data-userid="${user.id}" style="padding: 6px 10px; margin-right: 3px;" title="View Credentials">
                    <i class="fas fa-key"></i>
                </button>
                <button class="btn btn-success edit-user-btn" data-userid="${user.id}" style="padding: 6px 10px; margin-right: 3px;" title="Edit User">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-user-btn" data-userid="${user.id}" style="padding: 6px 10px;" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function displayCredentials(credentials) {
    const tableBody = document.getElementById('credentialsTableBody');
    tableBody.innerHTML = '';

    credentials.forEach(credential => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${credential.id}</td>
            <td><strong>${credential.website_name}</strong></td>
            <td>${credential.username}</td>
            <td>${credential.user_username}</td>
            <td>${formatDate(credential.created_at)}</td>
            <td>
                <button class="btn btn-secondary show-password-btn" data-credentialid="${credential.id}" style="padding: 6px 10px; margin-right: 3px;" title="Show Password">Show</button>
                <span class="password-display" id="password-display-${credential.id}" style="margin-right: 8px;"></span>
                <button class="btn btn-danger delete-credential-btn" data-credentialid="${credential.id}" style="padding: 6px 10px;" title="Delete Credential">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Main event binding and logic

document.addEventListener('DOMContentLoaded', function() {
    // Login
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Tabs
    document.getElementById('usersTabBtn').addEventListener('click', function(e) {
        switchTab('users', e);
    });
    document.getElementById('credentialsTabBtn').addEventListener('click', function(e) {
        switchTab('credentials', e);
    });

    // Add/Bulk Add User
    document.getElementById('addUserBtn').addEventListener('click', function() {
        openUserModal();
    });
    document.getElementById('bulkAddUserBtn').addEventListener('click', function() {
        openBulkUserModal();
    });

    // Modal close/cancel
    document.getElementById('closeUserModalBtn').addEventListener('click', closeUserModal);
    document.getElementById('cancelUserModalBtn').addEventListener('click', closeUserModal);
    document.getElementById('closeBulkUserModalBtn').addEventListener('click', closeBulkUserModal);
    document.getElementById('cancelBulkUserModalBtn').addEventListener('click', closeBulkUserModal);

    // User form
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
    document.getElementById('bulkUserForm').addEventListener('submit', handleBulkUserSubmit);

    // Search
    document.getElementById('userSearch').addEventListener('input', filterUsers);
    document.getElementById('credentialSearch').addEventListener('input', filterCredentials);

    // Table actions (delegated)
    document.getElementById('usersTableBody').addEventListener('click', function(e) {
        if (e.target.closest('.edit-user-btn')) {
            const userId = e.target.closest('.edit-user-btn').dataset.userid;
            openUserModal(Number(userId));
        } else if (e.target.closest('.delete-user-btn')) {
            const userId = e.target.closest('.delete-user-btn').dataset.userid;
            deleteUser(Number(userId));
        } else if (e.target.closest('.view-credentials-btn')) {
            const userId = e.target.closest('.view-credentials-btn').dataset.userid;
            viewUserCredentials(Number(userId));
        }
    });
    document.getElementById('credentialsTableBody').addEventListener('click', function(e) {
        if (e.target.closest('.delete-credential-btn')) {
            const credentialId = e.target.closest('.delete-credential-btn').dataset.credentialid;
            deleteCredential(Number(credentialId));
        } else if (e.target.closest('.show-password-btn')) {
            const credentialId = e.target.closest('.show-password-btn').dataset.credentialid;
            handleShowPassword(credentialId, e.target.closest('.show-password-btn'));
        }
    });

    // Modal close on outside click
    window.onclick = function(event) {
        const userModal = document.getElementById('userModal');
        const bulkUserModal = document.getElementById('bulkUserModal');
        if (event.target === userModal) closeUserModal();
        if (event.target === bulkUserModal) closeBulkUserModal();
    };

    // Initial state
    if (authToken) {
        showDashboard();
        loadStats();
        loadUsers();
        loadCredentials();
    } else {
        showLogin();
    }
});

// Functions for UI actions
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            showDashboard();
            loadStats();
            loadUsers();
            loadCredentials();
            showAlert('Login successful!', 'success');
        } else {
            showAlert(data.error || 'Login failed', 'error');
        }
    })
    .catch(error => {
        showAlert('Login failed. Please try again.', 'error');
    });
}

function logout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    showLogin();
    showAlert('Logged out successfully', 'success');
}

function switchTab(tabName, event) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    if (tabName === 'users') loadUsers();
    else if (tabName === 'credentials') loadCredentials();
}

function openUserModal(userId = null) {
    editingUserId = userId;
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');
    if (userId) {
        const user = currentUsers.find(u => u.id === userId);
        if (user) {
            title.textContent = 'Edit User';
            document.getElementById('modalUsername').value = user.username;
            document.getElementById('modalEmail').value = user.email;
            document.getElementById('modalPassword').value = '';
            document.getElementById('modalIsAdmin').checked = user.is_admin;
        }
    } else {
        title.textContent = 'Add New User';
        form.reset();
    }
    modal.style.display = 'block';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    editingUserId = null;
}

function handleUserSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('modalUsername').value;
    const email = document.getElementById('modalEmail').value;
    const password = document.getElementById('modalPassword').value;
    const isAdmin = document.getElementById('modalIsAdmin').checked;
    if (!username || !email) {
        showAlert('Username and email are required', 'error');
        return;
    }
    if (!editingUserId && !password) {
        showAlert('Password is required for new users', 'error');
        return;
    }
    if (password && password.length < 8) {
        showAlert('Password must be at least 8 characters', 'error');
        return;
    }
    const userData = { username, email, is_admin: isAdmin };
    if (password) userData.password = password;
    const url = editingUserId ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
    const method = editingUserId ? 'PUT' : 'POST';
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showAlert(data.message, 'success');
            closeUserModal();
            loadUsers();
            loadStats();
        } else {
            showAlert(data.error || 'Operation failed', 'error');
        }
    })
    .catch(error => {
        showAlert('Operation failed', 'error');
    });
}

function openBulkUserModal() {
    document.getElementById('bulkUserModal').style.display = 'block';
}

function closeBulkUserModal() {
    document.getElementById('bulkUserModal').style.display = 'none';
    document.getElementById('bulkUserData').value = '';
}

function handleBulkUserSubmit(e) {
    e.preventDefault();
    const bulkData = document.getElementById('bulkUserData').value.trim();
    if (!bulkData) {
        showAlert('Please enter user data', 'error');
        return;
    }
    const lines = bulkData.split('\n').filter(line => line.trim());
    const users = [];
    const errors = [];
    lines.forEach((line, index) => {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length !== 4) {
            errors.push(`Line ${index + 1}: Invalid format. Expected 4 fields.`);
            return;
        }
        const [username, email, password, isAdmin] = parts;
        if (!username || !email || !password) {
            errors.push(`Line ${index + 1}: Username, email, and password are required.`);
            return;
        }
        if (password.length < 8) {
            errors.push(`Line ${index + 1}: Password must be at least 8 characters.`);
            return;
        }
        if (!['0', '1'].includes(isAdmin)) {
            errors.push(`Line ${index + 1}: is_admin must be 0 or 1.`);
            return;
        }
        users.push({ username, email, password, is_admin: isAdmin === '1' });
    });
    if (errors.length > 0) {
        showAlert('Validation errors:\n' + errors.join('\n'), 'error');
        return;
    }
    if (users.length === 0) {
        showAlert('No valid users to add', 'error');
        return;
    }
    let successCount = 0;
    let errorCount = 0;
    users.forEach((user, index) => {
        fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify(user)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                successCount++;
            } else {
                errorCount++;
            }
            if (successCount + errorCount === users.length) {
                closeBulkUserModal();
                loadUsers();
                loadStats();
                if (errorCount === 0) {
                    showAlert(`Successfully added ${successCount} users!`, 'success');
                } else {
                    showAlert(`Added ${successCount} users successfully. ${errorCount} failed.`, 'error');
                }
            }
        })
        .catch(error => {
            errorCount++;
            if (successCount + errorCount === users.length) {
                closeBulkUserModal();
                loadUsers();
                loadStats();
                showAlert(`Added ${successCount} users successfully. ${errorCount} failed.`, 'error');
            }
        });
    });
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + authToken }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showAlert(data.message, 'success');
            loadUsers();
            loadStats();
        } else {
            showAlert(data.error || 'Delete failed', 'error');
        }
    })
    .catch(error => {
        showAlert('Delete failed', 'error');
    });
}

function deleteCredential(credentialId) {
    if (!confirm('Are you sure you want to delete this credential? This action cannot be undone.')) return;
    fetch(`/api/admin/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + authToken }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showAlert(data.message, 'success');
            loadCredentials();
            loadStats();
        } else {
            showAlert(data.error || 'Delete failed', 'error');
        }
    })
    .catch(error => {
        showAlert('Delete failed', 'error');
    });
}

function viewUserCredentials(userId) {
    const user = currentUsers.find(u => u.id === userId);
    if (!user) {
        showAlert('User not found', 'error');
        return;
    }
    switchTab('credentials', null);
    setTimeout(() => {
        document.getElementById('credentialSearch').value = user.username;
        filterCredentials();
    }, 100);
}

function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const filteredUsers = currentUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    displayUsers(filteredUsers);
}

function filterCredentials() {
    const searchTerm = document.getElementById('credentialSearch').value.toLowerCase();
    const filteredCredentials = currentCredentials.filter(credential => 
        credential.website_name.toLowerCase().includes(searchTerm) ||
        credential.username.toLowerCase().includes(searchTerm) ||
        credential.user_username.toLowerCase().includes(searchTerm)
    );
    displayCredentials(filteredCredentials);
} 

function handleShowPassword(credentialId, btn) {
    const display = document.getElementById(`password-display-${credentialId}`);
    if (btn.dataset.shown === 'true') {
        // Hide password
        display.textContent = '';
        btn.textContent = 'Show';
        btn.dataset.shown = 'false';
        return;
    }
    btn.textContent = 'Loading...';
    fetch(`/api/admin/credentials/${credentialId}/decrypt`, {
        headers: { 'Authorization': 'Bearer ' + authToken }
    })
    .then(res => res.json())
    .then(data => {
        if (data.password) {
            display.textContent = data.password;
            btn.textContent = 'Hide';
            btn.dataset.shown = 'true';
        } else {
            display.textContent = '[Error]';
            btn.textContent = 'Show';
            btn.dataset.shown = 'false';
        }
    })
    .catch(() => {
        display.textContent = '[Error]';
        btn.textContent = 'Show';
        btn.dataset.shown = 'false';
    });
} 
