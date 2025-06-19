
// Application State
let currentUser = null;
let authToken = localStorage.getItem('authToken');
const API_BASE = 'http://localhost:5000/api';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    // Setup tab navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.dataset.tab;
            if (tab) {
                switchTab(tab);
            }
        });
    });

    // Setup modal close buttons
    document.querySelectorAll('.close').forEach(close => {
        close.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });

    // Setup close-modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function setupEventListeners() {
    // Auth buttons
    document.getElementById('loginBtn').addEventListener('click', () => openModal('loginModal'));
    document.getElementById('registerBtn').addEventListener('click', () => openModal('registerModal'));
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('weatherForm').addEventListener('submit', handleWeatherSearch);
    document.getElementById('currencyForm').addEventListener('submit', handleCurrencyConversion);

    // Travel Plans management
    document.getElementById('addPlanBtn').addEventListener('click', () => {
        if (!authToken) {
            showToast('Please login to create travel plans', 'error');
            openModal('loginModal');
            return;
        }
        loadCountries().then(() => {
            openModal('createPlanModal');
        });
    });

    // Dashboard navigation buttons
    document.querySelectorAll('.dashboard-card .btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const text = this.textContent.trim();
            if (text === 'Manage Destinations') {
                if (!authToken) {
                    showToast('Please login to manage travel plans', 'error');
                    openModal('loginModal');
                    return;
                }
                switchTab('destinations');
            } else if (text === 'Check Weather') {
                switchTab('weather');
            } else if (text === 'Convert Currency') {
                switchTab('currency');
            }
        });
    });

    // Modal close handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close-modal') || e.target.classList.contains('close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                // Reset plan creation if closing create plan modal
                if (modal.id === 'createPlanModal') {
                    resetPlanCreation();
                }
            }
        }
    });
}

function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabName) {
            link.classList.add('active');
        }
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Load tab-specific data
    if (tabName === 'destinations' && authToken) {
        loadTravelPlans();
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        'error': 'fas fa-exclamation-triangle',
        'success': 'fas fa-check-circle',
        'info': 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="${iconMap[type] || iconMap.info}"></i>
            <div>
                <strong>${type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'}</strong>
                <p style="margin: 0; font-size: 0.9rem;">${message}</p>
            </div>
        </div>
    `;

    document.getElementById('toast-container').appendChild(toast);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);

    // Add click to dismiss
    toast.addEventListener('click', () => {
        toast.remove();
    });
}

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            // Handle specific error cases
            if (response.status === 401) {
                // Token expired or invalid
                if (authToken) {
                    logout();
                    showToast('Session expired. Please login again.', 'error');
                }
            }
            throw new Error(data.message || data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        
        throw error;
    }
}

function updateTravelPlansCount(count) {
    const countElement = document.getElementById('destinationCount');
    if (countElement) {
        countElement.textContent = `${count} travel plan${count !== 1 ? 's' : ''} created`;
    }
}

// Make functions globally available for dynamic content
window.switchTab = switchTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.apiRequest = apiRequest;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;