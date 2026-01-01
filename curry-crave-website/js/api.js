/*
 * Curry Crave - API Service Layer
 * Handles all communication with backend
 */

// API Configuration
// ⚠️ UPDATE THIS URL AFTER DEPLOYING BACKEND TO RENDER:
const PRODUCTION_URL = 'https://curry-crave-backend.onrender.com/api';
const LOCAL_URL = 'http://localhost:5001/api';

// Auto-detect environment: use production URL if not on localhost
const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';

const API_CONFIG = {
    BASE_URL: isLocalhost ? LOCAL_URL : PRODUCTION_URL,
    TIMEOUT: 10000,
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// ===== HELPER FUNCTIONS =====

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('adminToken');
}

/**
 * Get headers with authentication
 */
function getHeaders(includeAuth = false) {
    const headers = { ...API_CONFIG.HEADERS };

    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
}

/**
 * Handle API response
 */
async function handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
}

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const config = {
        ...options,
        headers: getHeaders(options.auth)
    };

    try {
        const response = await fetch(url, config);
        return await handleResponse(response);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== AUTHENTICATION API =====

const AuthAPI = {
    /**
     * Register new user
     */
    async register(userData) {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    /**
     * Login user
     */
    async login(credentials) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (data.success && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    },

    /**
     * Admin login
     */
    async adminLogin(credentials) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ ...credentials, isAdmin: true })
        });

        if (data.success && data.token) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
        }

        return data;
    },

    /**
     * Get user profile
     */
    async getProfile() {
        return apiRequest('/auth/profile', {
            auth: true
        });
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    }
};

// ===== FOOD ITEMS API =====

const FoodAPI = {
    /**
     * Get all food items
     */
    async getAll(filters = {}) {
        let query = '';

        if (filters.category) {
            query += `?category=${filters.category}`;
        }
        if (filters.search) {
            query += (query ? '&' : '?') + `search=${filters.search}`;
        }

        return apiRequest(`/food${query}`);
    },

    /**
     * Get single food item
     */
    async getById(id) {
        return apiRequest(`/food/${id}`);
    },

    /**
     * Create new food item (admin only)
     */
    async create(itemData) {
        return apiRequest('/food', {
            method: 'POST',
            body: JSON.stringify(itemData),
            auth: true
        });
    },

    /**
     * Update food item (admin only)
     */
    async update(id, itemData) {
        return apiRequest(`/food/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemData),
            auth: true
        });
    },

    /**
     * Delete food item (admin only)
     */
    async delete(id) {
        return apiRequest(`/food/${id}`, {
            method: 'DELETE',
            auth: true
        });
    },

    /**
     * Get popular items
     */
    async getPopular() {
        return apiRequest('/food/popular');
    }
};

// ===== CART API =====

const CartAPI = {
    /**
     * Get user's cart
     */
    async get() {
        return apiRequest('/cart', {
            auth: true
        });
    },

    /**
     * Add item to cart
     */
    async addItem(itemId, quantity = 1) {
        return apiRequest('/cart', {
            method: 'POST',
            body: JSON.stringify({
                foodItemId: itemId,
                quantity: quantity
            }),
            auth: true
        });
    },

    /**
     * Update cart item quantity
     */
    async updateItem(cartItemId, quantity) {
        return apiRequest(`/cart/${cartItemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
            auth: true
        });
    },

    /**
     * Remove item from cart
     */
    async removeItem(cartItemId) {
        return apiRequest(`/cart/${cartItemId}`, {
            method: 'DELETE',
            auth: true
        });
    },

    /**
     * Clear entire cart
     */
    async clear() {
        return apiRequest('/cart/clear', {
            method: 'DELETE',
            auth: true
        });
    }
};

// ===== ORDERS API =====

const OrderAPI = {
    /**
     * Get all orders (user or admin)
     */
    async getAll(filters = {}) {
        let query = '';

        if (filters.status) {
            query += `?status=${filters.status}`;
        }
        if (filters.userId) {
            query += (query ? '&' : '?') + `userId=${filters.userId}`;
        }

        return apiRequest(`/order${query}`, {
            auth: true
        });
    },

    /**
     * Get single order
     */
    async getById(id) {
        return apiRequest(`/order/${id}`, {
            auth: true
        });
    },

    /**
     * Create new order
     */
    async create(orderData) {
        return apiRequest('/order', {
            method: 'POST',
            body: JSON.stringify(orderData),
            auth: true
        });
    },

    /**
     * Update order status (admin only)
     */
    async updateStatus(id, status) {
        return apiRequest(`/order/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
            auth: true
        });
    },

    /**
     * Cancel order
     */
    async cancel(id) {
        return apiRequest(`/order/${id}/cancel`, {
            method: 'PUT',
            auth: true
        });
    },

    /**
     * Get user's order history
     */
    async getUserOrders() {
        return apiRequest('/order/user/history', {
            auth: true
        });
    }
};

// ===== PAYMENT API =====

const PaymentAPI = {
    /**
     * Create Razorpay order
     */
    async createOrder(amount, orderId) {
        return apiRequest('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({ amount, orderId }),
            auth: true
        });
    },

    /**
     * Verify payment
     */
    async verifyPayment(paymentData) {
        return apiRequest('/payment/verify', {
            method: 'POST',
            body: JSON.stringify(paymentData),
            auth: true
        });
    },

    /**
     * Handle failed payment
     */
    async handleFailedPayment(orderId, error) {
        return apiRequest('/payment/failed', {
            method: 'POST',
            body: JSON.stringify({ orderId, error }),
            auth: true
        });
    },

    /**
     * Get Razorpay Key (public)
     */
    getRazorpayKey() {
        // Return the test key - in production this should come from backend
        return 'rzp_test_RyefYqJac9UKYw';
    }
};


// ===== ADMIN API =====

const AdminAPI = {
    /**
     * Get dashboard statistics
     */
    async getStats() {
        return apiRequest('/admin/stats', {
            auth: true
        });
    },

    /**
     * Get all users
     */
    async getUsers() {
        return apiRequest('/admin/users', {
            auth: true
        });
    },

    /**
     * Get sales analytics
     */
    async getSalesAnalytics(period = '7days') {
        return apiRequest(`/admin/analytics?period=${period}`, {
            auth: true
        });
    }
};

// ===== CHECK BACKEND STATUS =====

/**
 * Check if backend is available
 */
async function checkBackendStatus() {
    try {
        const response = await fetch(API_CONFIG.BASE_URL.replace('/api', ''));
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.warn('Backend not available:', error.message);
        return false;
    }
}

/**
 * Initialize API connection
 */
async function initializeAPI() {
    const isBackendAvailable = await checkBackendStatus();

    if (isBackendAvailable) {
        console.log('✅ Backend connected successfully!');
        return true;
    } else {
        console.warn('⚠️ Backend not available. Using demo data.');
        return false;
    }
}

// ===== EXPORT API =====

window.API = {
    Auth: AuthAPI,
    Food: FoodAPI,
    Cart: CartAPI,
    Order: OrderAPI,
    Payment: PaymentAPI,
    Admin: AdminAPI,
    checkStatus: checkBackendStatus,
    initialize: initializeAPI,
    config: API_CONFIG
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', async function () {
    const backendAvailable = await initializeAPI();

    // Store backend status
    window.BACKEND_AVAILABLE = backendAvailable;

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('backendStatusChanged', {
        detail: { available: backendAvailable }
    }));
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.API;
}
