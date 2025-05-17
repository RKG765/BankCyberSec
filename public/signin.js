document.addEventListener('DOMContentLoaded', () => {
    const signinForm = document.getElementById('signinForm');
    const notification = document.getElementById('notification');

    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store the token
                localStorage.setItem('token', data.token);

                // Store user info
                const userInfo = {
                    username: username
                };
                localStorage.setItem('currentUser', JSON.stringify(userInfo));

                showNotification('Sign in successful! Redirecting...', 'success');

                // Redirect to home page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showNotification(data.error || 'Invalid username or password', 'error');
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