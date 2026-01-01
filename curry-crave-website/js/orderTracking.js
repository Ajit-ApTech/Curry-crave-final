/*
 * Curry Crave - Order Tracking
 * Handles order tracking functionality for customers
 */

// ===== SETUP TRACKING =====
document.addEventListener('DOMContentLoaded', function () {
    setupOrderTracking();

    // Add Track Order button to nav dynamically
    addTrackOrderButton();
});

function addTrackOrderButton() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    // Check if button already exists
    if (document.getElementById('trackOrderBtn')) return;

    const trackBtn = document.createElement('button');
    trackBtn.id = 'trackOrderBtn';
    trackBtn.className = 'track-order-btn';
    trackBtn.title = 'Track Your Orders';
    trackBtn.innerHTML = `
        <i class="fas fa-shipping-fast"></i>
        <span>Track</span>
    `;

    // Insert before cart button
    const cartBtn = navActions.querySelector('.cart-btn');
    if (cartBtn) {
        navActions.insertBefore(trackBtn, cartBtn);
    } else {
        navActions.prepend(trackBtn);
    }

    // Add event listener
    trackBtn.addEventListener('click', openOrderTracking);
}

function setupOrderTracking() {
    // Create modal if it doesn't exist
    if (!document.getElementById('orderTrackingModal')) {
        createTrackingModal();
    }

    const closeBtn = document.getElementById('closeTracking');
    const overlay = document.getElementById('trackingOverlay');

    closeBtn?.addEventListener('click', closeOrderTracking);
    overlay?.addEventListener('click', closeOrderTracking);
}

function createTrackingModal() {
    const modalHTML = `
        <div class="login-modal" id="orderTrackingModal">
            <div class="modal-overlay" id="trackingOverlay"></div>
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <button class="close-modal" id="closeTracking">
                    <i class="fas fa-times"></i>
                </button>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 class="modal-title" style="margin: 0;">
                        <i class="fas fa-shipping-fast" style="margin-right: 10px;"></i>
                        Track Your Orders
                    </h2>
                    <button onclick="refreshOrders()" class="refresh-orders-btn" title="Refresh orders" style="background: var(--primary-gold); color: var(--rich-black); border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-sync-alt"></i>
                        <span>Refresh</span>
                    </button>
                </div>
                
                <div class="tracking-content" id="trackingContent">
                    <!-- Will be populated by JavaScript -->
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openOrderTracking() {
    const modal = document.getElementById('orderTrackingModal');
    if (!modal) {
        createTrackingModal();
    }

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');

    if (!user || !token) {
        showToast('Please login to track your orders');
        document.getElementById('authBtn')?.click();
        return;
    }

    // Load and display orders
    loadUserOrders();

    // Show modal
    document.getElementById('orderTrackingModal').classList.add('active');

    // Start auto-refresh for real-time updates
    startOrderRefresh();
}

function closeOrderTracking() {
    document.getElementById('orderTrackingModal')?.classList.remove('active');
    // Stop auto-refresh when modal is closed
    stopOrderRefresh();
}

// Auto-refresh functionality
let orderRefreshInterval = null;

function startOrderRefresh() {
    // Clear any existing interval
    stopOrderRefresh();

    // Refresh orders every 25 seconds
    orderRefreshInterval = setInterval(() => {
        const modal = document.getElementById('orderTrackingModal');
        // Only refresh if modal is still open
        if (modal && modal.classList.contains('active')) {
            console.log('Auto-refreshing orders...');
            loadUserOrders();
        } else {
            stopOrderRefresh();
        }
    }, 25000); // 25 seconds
}

function stopOrderRefresh() {
    if (orderRefreshInterval) {
        clearInterval(orderRefreshInterval);
        orderRefreshInterval = null;
    }
}

async function loadUserOrders() {
    const trackingContent = document.getElementById('trackingContent');
    if (!trackingContent) return;

    // Show loading state
    trackingContent.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--light-gold);">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 20px;"></i>
            <p>Loading your orders...</p>
        </div>
    `;

    try {
        // Fetch from API using correct endpoint
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const apiBaseUrl = window.API?.config?.BASE_URL || 'http://localhost:5001/api';
        const response = await fetch(`${apiBaseUrl}/order/my-orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        // Check if API call was successful
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to load orders');
        }

        // Handle the orders array (could be empty)
        const orders = result.orders || [];

        if (orders.length === 0) {
            // Display "no orders" message
            trackingContent.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-shopping-bag" style="font-size: 64px; color: var(--light-gold); margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3 style="color: var(--cream); margin-bottom: 10px;">No Orders Yet</h3>
                    <p style="color: var(--light-gold); margin-bottom: 20px;">You haven't placed any orders yet. Start exploring our menu!</p>
                    <button onclick="closeOrderTracking()" 
                            style="padding: 12px 30px; background: var(--primary-gold); color: var(--rich-black); border: none; border-radius: 25px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-utensils"></i> Browse Menu
                    </button>
                </div>
            `;
            return;
        }

        // Display orders
        displayOrders(orders);

    } catch (error) {
        console.error('Failed to load orders from MongoDB:', error);
        trackingContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 64px; color: #e74c3c; margin-bottom: 20px;"></i>
                <h3 style="color: var(--cream); margin-bottom: 10px;">Failed to Load Orders</h3>
                <p style="color: var(--light-gold);">Please check your connection and try again.</p>
                <button onclick="loadUserOrders()" 
                        style="margin-top: 20px; padding: 12px 30px; background: var(--primary-gold); color: var(--rich-black); border: none; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
        return;
    }

}

function displayOrders(orders) {
    const trackingContent = document.getElementById('trackingContent');
    if (!trackingContent) return;

    // Sort orders by date (newest first)
    const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
    });

    trackingContent.innerHTML = sortedOrders.map(order => {
        const orderId = order.orderId || order.id || order._id;
        const orderDate = new Date(order.createdAt || order.date || Date.now());
        const formattedDate = orderDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const status = order.orderStatus || order.status || 'pending';
        const total = order.totalAmount || parseFloat(order.amount?.replace('₹', '')) || 0;

        // Get items list
        let itemsList = '';
        if (Array.isArray(order.items)) {
            itemsList = order.items.map(item =>
                `${item.name || item.food?.name || 'Item'} (x${item.quantity || 1})`
            ).join(', ');
        } else if (typeof order.items === 'string') {
            itemsList = order.items;
        }

        // Status timeline
        const statusSteps = [
            { key: 'pending', label: 'Order Placed', icon: 'fa-receipt' },
            { key: 'confirmed', label: 'Confirmed', icon: 'fa-check-circle' },
            { key: 'preparing', label: 'Preparing', icon: 'fa-utensils' },
            { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'fa-shipping-fast' },
            { key: 'delivered', label: 'Delivered', icon: 'fa-box-open' }
        ];

        const statusOrder = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
        const currentStatusIndex = statusOrder.indexOf(status);
        const isCancelled = status === 'cancelled';

        const timelineHTML = statusSteps.map((step, index) => {
            const isCompleted = !isCancelled && index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex && !isCancelled;

            return `
                <div class="status-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                    <div class="step-icon">
                        <i class="fas ${step.icon}"></i>
                    </div>
                    <div class="step-label">${step.label}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="order-tracking-card" style="margin-bottom: 30px; background: rgba(212, 175, 55, 0.05); border: 1px solid var(--primary-gold); border-radius: 15px; overflow: hidden;">
                <!-- Order Header -->
                <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05)); padding: 20px; border-bottom: 1px solid var(--primary-gold);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <h3 style="color: var(--primary-gold); margin: 0 0 8px 0; font-size: 20px;">Order #${orderId}</h3>
                            <p style="color: var(--light-gold); margin: 0; font-size: 14px;">
                                <i class="far fa-clock"></i> ${formattedDate}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <span class="status-badge status-${status}" style="font-size: 14px; padding: 8px 20px; display: inline-block;">
                                ${isCancelled ? 'Cancelled' : status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <p style="color: var(--vibrant-green); margin: 10px 0 0 0; font-size: 22px; font-weight: 700;">₹${total}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Order Items -->
                <div style="padding: 20px; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
                    <h4 style="color: var(--cream); margin: 0 0 12px 0; font-size: 16px;">
                        <i class="fas fa-utensils"></i> Order Items
                    </h4>
                    <p style="color: var(--light-gold); margin: 0; line-height: 1.6;">${itemsList}</p>
                </div>
                
                <!-- Status Timeline -->
                ${!isCancelled ? `
                <div style="padding: 30px 20px;">
                    <h4 style="color: var(--cream); margin: 0 0 25px 0; font-size: 16px;">
                        <i class="fas fa-route"></i> Order Status
                    </h4>
                    <div class="status-timeline">
                        ${timelineHTML}
                    </div>
                </div>
                ` : `
                <div style="padding: 30px 20px; text-align: center;">
                    <i class="fas fa-times-circle" style="font-size: 48px; color: #e74c3c; margin-bottom: 15px;"></i>
                    <p style="color: #e74c3c; font-size: 16px; margin: 0;">This order has been cancelled</p>
                </div>
                `}
            </div>
        `;
    }).join('');

    // Add CSS for timeline if not exists
    if (!document.getElementById('tracking-styles')) {
        const style = document.createElement('style');
        style.id = 'tracking-styles';
        style.textContent = `
            .track-order-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, var(--primary-gold), #F4E4C1);
                color: var(--rich-black);
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
                position: relative;
                overflow: hidden;
            }
            
            .track-order-btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%);
                transition: width 0.6s, height 0.6s;
            }
            
            .track-order-btn:hover::before {
                width: 300px;
                height: 300px;
            }
            
            .track-order-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
            }
            
            .track-order-btn:active {
                transform: translateY(0);
            }
            
            .track-order-btn i {
                font-size: 16px;
                position: relative;
                z-index: 1;
            }
            
            .track-order-btn span {
                position: relative;
                z-index: 1;
            }
            
            @media (max-width: 768px) {
                .track-order-btn span {
                    display: none;
                }
                .track-order-btn {
                    padding: 12px 16px;
                }
            }
            
            .status-timeline {
                display: flex;
                justify-content: space-between;
                position: relative;
                padding: 0 10px;
            }
            
            .status-timeline::before {
                content: '';
                position: absolute;
                top: 20px;
                left: 10%;
                right: 10%;
                height: 2px;
                background: rgba(212, 175, 55, 0.2);
                z-index: 0;
            }
            
            .status-step {
                flex: 1;
                text-align: center;
                position: relative;
                z-index: 1;
            }
            
            .step-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(212, 175, 55, 0.1);
                border: 2px solid rgba(212, 175, 55, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 10px;
                color: var(--light-gold);
                transition: all 0.3s;
            }
            
            .step-label {
                color: var(--light-gold);
                font-size: 12px;
                font-weight: 500;
            }
            
            .status-step.completed .step-icon {
                background: var(--primary-gold);
                border-color: var(--primary-gold);
                color: var(--rich-black);
            }
            
            .status-step.current .step-icon {
                background: var(--vibrant-green);
                border-color: var(--vibrant-green);
                color: white;
                box-shadow: 0 0 20px rgba(46, 204, 113, 0.5);
                animation: pulse 2s infinite;
            }
            
            .status-step.current .step-label {
                color: var(--vibrant-green);
                font-weight: 700;
            }
            
            @keyframes pulse {
                0%, 100% {
                    box-shadow: 0 0 20px rgba(46, 204, 113, 0.5);
                }
                50% {
                    box-shadow: 0 0 30px rgba(46, 204, 113, 0.8);
                }
            }
            
            @media (max-width: 768px) {
                .status-timeline {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .status-timeline::before {
                    top: 0;
                    bottom: 0;
                    left: 30px;
                    right: auto;
                    width: 2px;
                    height: auto;
                }
                
                .status-step {
                    display: flex;
                    align-items: center;
                    text-align: left;
                    margin-bottom: 20px;
                    width: 100%;
                }
                
                .step-icon {
                    margin: 0 15px 0 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Manual refresh function
function refreshOrders() {
    console.log('Manual refresh triggered');
    loadUserOrders();
    showToast('🔄 Refreshing orders...');
}

// Make functions globally accessible
window.openOrderTracking = openOrderTracking;
window.closeOrderTracking = closeOrderTracking;
window.loadUserOrders = loadUserOrders;
window.refreshOrders = refreshOrders;
