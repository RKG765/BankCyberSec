document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // DOM Elements
    const dashboardBtn = document.getElementById('dashboard-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const transactionForm = document.getElementById('transactionForm');
    const transactionsList = document.getElementById('transactions-list');
    const filterPeriod = document.getElementById('filter-period');
    const searchInput = document.getElementById('search-transactions');
    const balanceAmount = document.getElementById('balance-amount');

    // Event Listeners
    dashboardBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });

    transactionForm.addEventListener('submit', handleTransaction);
    filterPeriod.addEventListener('change', loadTransactions);
    searchInput.addEventListener('input', filterTransactions);

    // Initial Load
    loadBalance();
    loadTransactions();

    // Functions
    async function loadBalance() {
        try {
            const response = await fetch('/api/transactions/balance', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                balanceAmount.textContent = `$${data.balance.toFixed(2)}`;
            }
        } catch (error) {
            showNotification('error', 'Error', 'Failed to load balance');
        }
    }

    async function loadTransactions() {
        try {
            const period = filterPeriod.value;
            const response = await fetch(`/api/transactions/history?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const transactions = await response.json();
                displayTransactions(transactions);
            }
        } catch (error) {
            showNotification('error', 'Error', 'Failed to load transactions');
        }
    }

    function displayTransactions(transactions) {
        transactionsList.innerHTML = '';
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="no-transactions">
                    <i class="fas fa-exchange-alt"></i>
                    <p>No transactions found</p>
                </div>
            `;
            return;
        }

        transactions.forEach(transaction => {
            const isCredit = transaction.type === 'credit';
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction-item';
            
            transactionElement.innerHTML = `
                <div class="transaction-icon ${isCredit ? 'credit' : 'debit'}">
                    <i class="fas ${isCredit ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-recipient">${transaction.recipient}</div>
                    <div class="transaction-description">${transaction.description || 'No description'}</div>
                </div>
                <div class="transaction-info">
                    <div class="transaction-amount ${isCredit ? 'credit' : 'debit'}">
                        ${isCredit ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                    <div class="transaction-date">
                        ${new Date(transaction.timestamp).toLocaleDateString()}
                    </div>
                </div>
            `;
            
            transactionsList.appendChild(transactionElement);
        });
    }

    async function handleTransaction(event) {
        event.preventDefault();
        
        const amount = parseFloat(document.getElementById('amount').value);
        const recipient = document.getElementById('recipient').value;
        const description = document.getElementById('description').value;
        
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount, recipient, description })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('success', 'Transaction Successful', 
                    `Successfully transferred $${amount.toFixed(2)} to ${recipient}`);
                transactionForm.reset();
                loadBalance();
                loadTransactions();
            } else {
                showNotification('error', 'Transaction Failed', data.message || 'An error occurred');
            }
        } catch (error) {
            showNotification('error', 'Error', 'Failed to process transaction');
        }
    }

    function filterTransactions() {
        const searchTerm = searchInput.value.toLowerCase();
        const transactions = transactionsList.querySelectorAll('.transaction-item');
        
        transactions.forEach(transaction => {
            const text = transaction.textContent.toLowerCase();
            transaction.style.display = text.includes(searchTerm) ? 'grid' : 'none';
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
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}); 