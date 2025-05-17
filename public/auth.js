document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const loginContainer = document.querySelector('.form-container');
    const signupContainer = document.getElementById('signupForm');
    const signinLink = document.getElementById('signin-link');
    const registerLink = document.getElementById('register-link');
    const transactionsLink = document.getElementById('transactions-link');
    const logoutBtn = document.getElementById('logout-btn');

    // Toggle between login and signup forms
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'block';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // Handle login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                showNotification('success', 'Login Successful', 'Welcome back!');
                setTimeout(() => {
                    window.location.href = '/transactions.html';
                }, 1000);
            } else {
                showNotification('error', 'Login Failed', data.error || 'Invalid credentials');
            }
        } catch (error) {
            showNotification('error', 'Error', 'Failed to connect to server');
        }
    });

    // Handle registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showNotification('error', 'Registration Failed', 'Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('success', 'Registration Successful', 'Please login with your new account');
                setTimeout(() => {
                    signupContainer.style.display = 'none';
                    loginContainer.style.display = 'block';
                    registerForm.reset();
                }, 1000);
            } else {
                showNotification('error', 'Registration Failed', data.error || 'Failed to create account');
            }
        } catch (error) {
            showNotification('error', 'Error', 'Failed to connect to server');
        }
    });

    // Notification System
    function showNotification(type, title, message) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon;
        switch(type) {
            case 'error':
                icon = 'fa-exclamation-circle';
                break;
            case 'success':
                icon = 'fa-check-circle';
                break;
            case 'warning':
                icon = 'fa-exclamation-triangle';
                break;
            default:
                icon = 'fa-info-circle';
        }

        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Check authentication status
    function checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            // User is logged in
            signinLink.classList.add('hidden');
            registerLink.classList.add('hidden');
            transactionsLink.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
        } else {
            // User is not logged in
            signinLink.classList.remove('hidden');
            registerLink.classList.remove('hidden');
            transactionsLink.classList.add('hidden');
            logoutBtn.classList.add('hidden');
        }
    }

    // Handle logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        checkAuth();
        window.location.href = 'index.html';
    });

    // Initial check
    checkAuth();
}); 