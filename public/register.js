document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const notification = document.getElementById('notification');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form values
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const initialDeposit = parseFloat(document.getElementById('initialDeposit').value);

        // Validate passwords match
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        // Validate initial deposit
        if (initialDeposit < 100) {
            showNotification('Initial deposit must be at least $100', 'error');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    initialDeposit
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Account created successfully! Redirecting to home page...', 'success');
                // Clear form
                registerForm.reset();

                // Try to log in automatically with the new credentials
                try {
                    const loginResponse = await fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username,
                            password
                        })
                    });

                    const loginData = await loginResponse.json();

                    if (loginResponse.ok) {
                        // Store the token
                        localStorage.setItem('token', loginData.token);

                        // Store user info
                        const userInfo = {
                            username: username,
                            email: email
                        };
                        localStorage.setItem('currentUser', JSON.stringify(userInfo));
                    }
                } catch (error) {
                    console.error('Auto-login error:', error);
                }

                // Redirect to home page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showNotification(data.error || 'Failed to create account', 'error');
            }
        } catch (error) {
            showNotification('Error connecting to server', 'error');
        }
    });

    function showNotification(message, type = 'info') {
        notification.className = `notification ${type}`;
        notification.querySelector('i').className = `fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}`;
        notification.querySelector('span').textContent = message;
        notification.style.display = 'flex';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
});