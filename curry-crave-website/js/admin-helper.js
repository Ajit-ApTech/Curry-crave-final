// Helper functions for dashboard data - paste these into admin.js after loadDashboardData

function displayTopItems(items) {
    const container = document.getElementById('topItemsList');
    if (!container) return;

    container.innerHTML = items.map((item, index) => `
        <div class="top-item">
            <div class="top-item-rank">${index + 1}</div>
            <div class="top-item-info">
                <div class="top-item-name">${item.name}</div>
                <div class="top-item-count">${item.totalQuantity} orders</div>
            </div>
            <div class="top-item-revenue">₹${item.totalRevenue.toLocaleString('en-IN')}</div>
        </div>
    `).join('');
}

function displayRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--light-gold);">No orders yet</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString('en-IN');
        const customerName = order.user?.name || 'Guest';
        const itemNames = order.items?.map(item => item.food?.name || 'Item').join(', ') || 'N/A';

        return `
            <tr>
                <td><strong>#${order._id.slice(-6).toUpperCase()}</strong></td>
                <td>${customerName}</td>
                <td>${itemNames}</td>
                <td><strong>₹${order.totalAmount}</strong></td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${date}</td>
                <td><button class="action-btn" onclick="viewOrder('${order._id}')">View</button></td>
            </tr>
        `;
    }).join('');
}

// Update existing loadTopItems function to this:
async function loadTopItemsNew() {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_URL}/admin/top-items?limit=5`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch top items');
        }

        const result = await response.json();

        if (result.success && result.data.length > 0) {
            displayTopItems(result.data);
        } else {
            const container = document.getElementById('topItemsList');
            if (container) {
                container.innerHTML = '<p style="color: var(--light-gold); padding: 20px; text-align: center;">No sales data available yet</p>';
            }
        }
    } catch (error) {
        console.error('Error loading top items:', error);
        const container = document.getElementById('topItemsList');
        if (container) {
            container.innerHTML = '<p style="color: var(--light-gold); padding: 20px; text-align: center;">No sales data available yet</p>';
        }
    }
}
