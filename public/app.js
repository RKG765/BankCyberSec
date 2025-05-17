document.addEventListener('DOMContentLoaded', () => {
    const signinLink = document.getElementById('signin-link');
    const registerLink = document.getElementById('register-link');
    const logoutBtn = document.getElementById('logout-btn');
    const transactionsLink = document.getElementById('transactions-link');
    const heroTransactionsLink = document.getElementById('hero-transactions-link');
    const userSection = document.getElementById('user-section');
    const userGreeting = document.getElementById('user-greeting');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const dashboard = document.getElementById('dashboard');
    const mainContent = document.querySelector('main');
    const usernameDisplay = document.getElementById('username-display');
    const lastLoginTime = document.getElementById('last-login-time');
    const alertsList = document.getElementById('alerts-list');
    const recentTransactionsList = document.getElementById('recent-transactions-list');
    const authButtons = document.getElementById('auth-buttons');

    let currentUser = null;

    // Handle smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Close any open forms before scrolling
                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');

                // Scroll to the target section with smooth behavior
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Add active class to the clicked link
                navLinks.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');

                // Update URL hash without causing a page jump
                history.pushState(null, null, targetId);
            }
        });
    });

    // Check if URL contains a hash on page load and scroll to that section
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Add active class to the corresponding nav link
                const activeLink = document.querySelector(`.nav-links a[href="${window.location.hash}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }, 500); // Short delay to ensure DOM is ready
        }
    }

    // Show login form
    function showLoginForm() {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        dashboard.classList.add('hidden');
        mainContent.scrollIntoView({ behavior: 'smooth' });
    }

    // Show register form
    function showRegisterForm() {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        dashboard.classList.add('hidden');
        mainContent.scrollIntoView({ behavior: 'smooth' });
    }

    // Show dashboard
    function showDashboard() {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        dashboard.classList.remove('hidden');

        // Update user greeting and show user section
        if (currentUser) {
            // Hide login/register links
            if (signinLink) {
                signinLink.classList.add('hidden');
            }
            if (registerLink) {
                registerLink.classList.add('hidden');
            }

            // Show user section with greeting
            if (userSection) {
                userSection.classList.remove('hidden');
            }

            // Update user greeting
            if (userGreeting) {
                userGreeting.textContent = `Hello, ${currentUser.username}`;
            }

            // Make sure logout button has event listener
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }

            usernameDisplay.textContent = currentUser.username;
            lastLoginTime.textContent = new Date().toLocaleString();
        }

        loadDashboardData();
    }

    // Add event listeners for all login buttons
    [loginBtn, heroLoginBtn].forEach(button => {
        if (button) {
            button.addEventListener('click', showLoginForm);
        }
    });

    // Add event listeners for all register buttons
    [registerBtn, heroRegisterBtn].forEach(button => {
        if (button) {
            button.addEventListener('click', showRegisterForm);
        }
    });

    // Handle login form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Create a session
                currentUser = {
                    username: username,
                    ...data.user
                };
                localStorage.setItem('token', data.token);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                showNotification('success', 'Welcome Back', 'You have successfully signed in');
                showDashboard();
            } else {
                showNotification('error', 'Login Failed', data.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('error', 'Error', 'Failed to login. Please try again.');
        }
    });

    // Handle register form submission
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        // Validate password strength
        if (!isPasswordStrong(password)) {
            showNotification('error', 'Weak Password', 'Password must be at least 8 characters long and include numbers, letters, and special characters');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('success', 'Account Created', 'Your account has been created successfully');
                showLoginForm();
            } else {
                showNotification('error', 'Registration Failed', data.message || 'Username or email already exists');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('error', 'Error', 'Failed to register. Please try again.');
        }
    });

    // Logout function
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        currentUser = null;

        // Show login/register links
        if (signinLink) {
            signinLink.classList.remove('hidden');
        }
        if (registerLink) {
            registerLink.classList.remove('hidden');
        }

        // Hide user section
        if (userSection) {
            userSection.classList.add('hidden');
        }

        // Hide transactions links
        if (transactionsLink) {
            transactionsLink.classList.add('hidden');
        }
        if (heroTransactionsLink) {
            heroTransactionsLink.classList.add('hidden');
        }

        showNotification('success', 'Logged Out', 'You have been logged out successfully');

        // Hide dashboard, show hero section
        dashboard.classList.add('hidden');
        document.querySelector('.hero-section').classList.remove('hidden');
    }

    // Password strength validation
    function isPasswordStrong(password) {
        const minLength = 8;
        const hasNumber = /\d/.test(password);
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength && hasNumber && hasLetter && hasSpecialChar;
    }

    // Check if user is already logged in
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');

    if (storedToken && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);

            // Hide login/register links
            if (signinLink) {
                signinLink.classList.add('hidden');
            }
            if (registerLink) {
                registerLink.classList.add('hidden');
            }

            // Show user section with greeting
            if (userSection) {
                userSection.classList.remove('hidden');
            }

            // Update user greeting
            if (userGreeting) {
                userGreeting.textContent = `Hello, ${currentUser.username}`;
            }

            // Show transactions links
            if (transactionsLink) {
                transactionsLink.classList.remove('hidden');
            }
            if (heroTransactionsLink) {
                heroTransactionsLink.classList.remove('hidden');
            }

            // Make sure user section is visible with correct greeting
            if (userSection) {
                userSection.classList.remove('hidden');
            }
            if (userGreeting) {
                userGreeting.textContent = `Hello, ${currentUser.username}`;
            }

            // Make sure logout button has event listener
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }

            showDashboard();
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
        }
    }

    // Add new function to load dashboard data
    async function loadDashboardData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('error', 'Authentication Error', 'Please sign in to view your dashboard');
                return;
            }

            // Fetch balance
            const balanceResponse = await fetch('/api/transactions/balance', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json();
                document.getElementById('dashboard-balance').textContent = `$${balanceData.balance.toFixed(2)}`;
            } else {
                // Fallback to stored user data if API fails
                if (currentUser && currentUser.balance) {
                    document.getElementById('dashboard-balance').textContent = `$${currentUser.balance.toFixed(2)}`;
                }
            }

            // Fetch recent transactions
            const transactionsResponse = await fetch('/api/transactions/recent', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (transactionsResponse.ok) {
                const transactions = await transactionsResponse.json();
                displayTransactions(transactions);
            } else {
                // Fallback to mock transactions if API fails
                displayMockTransactions();
            }

            // Fetch security alerts
            const alertsResponse = await fetch('/api/security/logs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (alertsResponse.ok) {
                const alerts = await alertsResponse.json();
                displayAlerts(alerts);
            } else {
                // Fallback to mock alerts if API fails
                displayMockAlerts();
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Use mock data as fallback
            displayMockTransactions();
            displayMockAlerts();
        }
    }

    // Display transactions from API
    function displayTransactions(transactions) {
        recentTransactionsList.innerHTML = '';

        if (!transactions || transactions.length === 0) {
            recentTransactionsList.innerHTML = '<p class="no-transactions">No recent transactions</p>';
            return;
        }

        transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'recent-transaction-item';

            const details = document.createElement('div');
            details.className = 'recent-transaction-details';

            const recipient = document.createElement('div');
            recipient.className = 'recent-transaction-recipient';
            recipient.textContent = transaction.recipient || 'Unknown';

            const description = document.createElement('div');
            description.className = 'recent-transaction-description';
            description.textContent = transaction.description || 'Transaction';

            const amount = document.createElement('div');
            amount.className = `recent-transaction-amount ${transaction.type}`;
            amount.textContent = transaction.type === 'credit' ? `+$${transaction.amount.toFixed(2)}` : `-$${transaction.amount.toFixed(2)}`;

            details.appendChild(recipient);
            details.appendChild(description);
            transactionItem.appendChild(details);
            transactionItem.appendChild(amount);
            recentTransactionsList.appendChild(transactionItem);
        });
    }

    // Display alerts from API
    function displayAlerts(alerts) {
        alertsList.innerHTML = '';

        if (!alerts || alerts.length === 0) {
            alertsList.innerHTML = '<p class="no-alerts">No security alerts</p>';
            return;
        }

        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert-item ${alert.eventType === 'suspicious_transaction' ? 'error' :
                alert.eventType === 'security_alert' ? 'warning' : 'success'}`;

            let icon;
            switch(alert.eventType) {
                case 'suspicious_transaction':
                    icon = 'fa-exclamation-circle';
                    break;
                case 'security_alert':
                    icon = 'fa-shield-alt';
                    break;
                default:
                    icon = 'fa-info-circle';
            }

            alertElement.innerHTML = `
                <i class="fas ${icon}"></i>
                <div>${alert.details}</div>
            `;

            alertsList.appendChild(alertElement);
        });
    }

    // Display mock transaction data
    function displayMockTransactions() {
        const mockTransactions = [
            { recipient: 'John Doe', description: 'Monthly Transfer', amount: 250.00, type: 'debit', timestamp: new Date() },
            { recipient: 'Amazon', description: 'Online Purchase', amount: 85.99, type: 'debit', timestamp: new Date(Date.now() - 86400000) },
            { recipient: 'Payroll', description: 'Salary Deposit', amount: 1250.00, type: 'credit', timestamp: new Date(Date.now() - 172800000) }
        ];

        recentTransactionsList.innerHTML = '';

        mockTransactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'recent-transaction-item';

            const details = document.createElement('div');
            details.className = 'recent-transaction-details';

            const recipient = document.createElement('div');
            recipient.className = 'recent-transaction-recipient';
            recipient.textContent = transaction.recipient;

            const description = document.createElement('div');
            description.className = 'recent-transaction-description';
            description.textContent = transaction.description;

            const amount = document.createElement('div');
            amount.className = `recent-transaction-amount ${transaction.type}`;
            amount.textContent = transaction.type === 'credit' ? `+$${transaction.amount.toFixed(2)}` : `-$${transaction.amount.toFixed(2)}`;

            details.appendChild(recipient);
            details.appendChild(description);
            transactionItem.appendChild(details);
            transactionItem.appendChild(amount);
            recentTransactionsList.appendChild(transactionItem);
        });
    }

    // Display mock security alerts
    function displayMockAlerts() {
        const mockAlerts = [
            { eventType: 'security_alert', details: 'New login from Chrome on Windows', timestamp: new Date() },
            { eventType: 'system_update', details: 'Account security settings updated', timestamp: new Date(Date.now() - 259200000) }
        ];

        alertsList.innerHTML = '';

        mockAlerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert-item ${alert.eventType === 'suspicious_transaction' ? 'error' :
                alert.eventType === 'security_alert' ? 'warning' : 'success'}`;

            let icon;
            switch(alert.eventType) {
                case 'suspicious_transaction':
                    icon = 'fa-exclamation-circle';
                    break;
                case 'security_alert':
                    icon = 'fa-shield-alt';
                    break;
                default:
                    icon = 'fa-info-circle';
            }

            alertElement.innerHTML = `
                <i class="fas ${icon}"></i>
                <div>${alert.details}</div>
            `;

            alertsList.appendChild(alertElement);
        });
    }

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

        // Remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Quick Actions Event Listeners
    const viewTransactionsBtn = document.getElementById('view-transactions');
    if (viewTransactionsBtn) {
        viewTransactionsBtn.addEventListener('click', () => {
            window.location.href = '/transactions.html';
        });
    }

    const manageCardsBtn = document.querySelector('.action-button:nth-child(3)');
    if (manageCardsBtn) {
        manageCardsBtn.addEventListener('click', () => {
            showNotification('warning', 'Card Management', 'This feature is coming soon!');
        });
    }
});