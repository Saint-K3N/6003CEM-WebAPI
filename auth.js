// Authentication JavaScript

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    showLoading();
    try {
        // Try login with username first, then email
        let response;
        try {
            response = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: username, password })
            });
        } catch (error) {
            // If email login fails, try with username
            const user = await apiRequest('/auth/login-username', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            response = user;
        }

        authToken = response.token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);
        
        updateAuthUI(true);
        closeModal('loginModal');
        showToast('Login successful!', 'success');
        loadDestinations();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = {
        firstName: document.getElementById('regFirstName').value,
        lastName: document.getElementById('regLastName').value,
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        country: document.getElementById('regCountry').value
    };

    showLoading();
    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showToast('Registration successful! You are now logged in.', 'success');
        
        // Auto-login after registration
        authToken = response.token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);
        
        updateAuthUI(true);
        closeModal('registerModal');
        loadDestinations();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateAuthUI(false);
    showToast('Logged out successfully', 'success');
    
    // Clear destinations list
    document.getElementById('destinationsList').innerHTML = '';
    updateDestinationCount(0);
}

async function checkAuthStatus() {
    if (authToken) {
        try {
            const response = await apiRequest('/auth/profile');
            currentUser = response.user;
            updateAuthUI(true);
            loadDestinations();
        } catch (error) {
            // Token is invalid, clear it
            logout();
        }
    }
}

function updateAuthUI(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');

    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser ? `${currentUser.firstName || currentUser.username}` : 'User';
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

// Make functions globally available
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
