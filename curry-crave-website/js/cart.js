/*
 * Curry Crave - Cart Management
 * Handles shopping cart functionality
 */

// Cart state
let cart = [];
const CART_STORAGE_KEY = 'curryCraveCart';

// API URL helper - use production URL as fallback
const PRODUCTION_API_URL = 'https://curry-crave-backend.onrender.com/api';
function getApiUrl() {
    return window.API?.config?.BASE_URL || PRODUCTION_API_URL;
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function () {
    loadCartFromStorage();
    setupCartListeners();
    updateCartUI();
});

// ===== CART LISTENERS =====
function setupCartListeners() {
    const cartBtn = document.querySelector('.cart-btn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Open cart sidebar
    cartBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        cartSidebar?.classList.add('active');
        updateCartDisplay();
    });

    // Close cart sidebar
    closeCart?.addEventListener('click', function () {
        cartSidebar?.classList.remove('active');
    });

    // Checkout button
    checkoutBtn?.addEventListener('click', function () {
        handleCheckout();
    });
}

// ===== ADD ITEM TO CART =====
function addItemToCart(item) {
    const existingItem = cart.find(cartItem => String(cartItem.id) === String(item.id) || String(cartItem._id) === String(item._id || item.id));

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }

    saveCartToStorage();
    updateCartUI();
    updateCartDisplay();
}

// ===== UPDATE QUANTITY =====
function updateQuantity(itemId, change) {
    const item = cart.find(cartItem => String(cartItem.id) === String(itemId) || String(cartItem._id) === String(itemId));

    if (item) {
        item.quantity += change;

        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            saveCartToStorage();
            updateCartUI();
            updateCartDisplay();
        }
    }
}

// ===== REMOVE FROM CART =====
function removeFromCart(itemId) {
    cart = cart.filter(item => String(item.id) !== String(itemId) && String(item._id || item.id) !== String(itemId));
    saveCartToStorage();
    updateCartUI();
    updateCartDisplay();

    if (typeof window.showToast === 'function') {
        window.showToast('Item removed from cart');
    }
}

// ===== UPDATE CART UI =====
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// ===== UPDATE CART DISPLAY =====
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const totalAmount = document.getElementById('totalAmount');

    if (!cartItems || !totalAmount) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--light-gold); opacity: 0.7;">
                <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p style="font-size: 16px;">Your cart is empty</p>
                <p style="font-size: 14px; margin-top: 8px;">Add some delicious items!</p>
            </div>
        `;
        totalAmount.textContent = '₹0';
        return;
    }

    // Display cart items
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/images/placeholder.jpg'">
            </div>
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.name}</h4>
                <p class="cart-item-price">₹${item.price} × ${item.quantity}</p>
                <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="updateQuantity('${item._id || item.id}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span style="color: var(--primary-gold); font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item._id || item.id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="quantity-btn" onclick="removeFromCart('${item._id || item.id}')" style="margin-left: auto; border-color: var(--vibrant-red);">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Calculate and display total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalAmount.textContent = `₹${total}`;
}

// ===== CHECKOUT =====
function handleCheckout() {
    if (cart.length === 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Your cart is empty!');
        }
        return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
        if (typeof window.showToast === 'function') {
            window.showToast('Please login to place an order', 'error');
        }
        if (typeof window.openLoginModal === 'function') {
            window.openLoginModal();
        }
        return;
    }

    // Show checkout modal to collect customer details
    showCheckoutModal();
}

// ===== SHOW CHECKOUT MODAL =====
function showCheckoutModal() {
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Create checkout modal
    const modal = document.createElement('div');
    modal.id = 'checkoutModal';
    modal.className = 'login-modal active';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="max-width: 520px; max-height: 90vh; overflow-y: auto;">
            <button class="close-modal" onclick="closeCheckoutModal()">
                <i class="fas fa-times"></i>
            </button>
            <h2 class="modal-title">Complete Your Order</h2>
            <p style="text-align: center; color: var(--light-gold); margin-bottom: 20px;">
                ${itemCount} item(s) • Total: ₹${total}
            </p>
            <form class="login-form" id="checkoutForm" onsubmit="submitOrder(event)">
                <!-- Customer Details Section -->
                <div class="form-group">
                    <label>
                        <i class="fas fa-user"></i>
                        Full Name
                    </label>
                    <input type="text" id="customerName" required placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label>
                        <i class="fas fa-envelope"></i>
                        Email
                    </label>
                    <input type="email" id="customerEmail" required placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label>
                        <i class="fas fa-phone"></i>
                        Phone Number
                    </label>
                    <input type="tel" id="customerPhone" required placeholder="Enter your phone number" pattern="[0-9]{10}">
                </div>
                <div class="form-group">
                    <label>
                        <i class="fas fa-map-pin"></i>
                        Pincode
                    </label>
                    <div style="position: relative;">
                        <input type="text" id="customerPincode" required placeholder="Enter 6-digit pincode" 
                               pattern="[0-9]{6}" maxlength="6" style="padding-right: 40px;"
                               oninput="validateDeliveryPincode(this.value)">
                        <div id="pincodeLoader" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); display: none;">
                            <i class="fas fa-spinner fa-spin" style="color: var(--primary-gold);"></i>
                        </div>
                    </div>
                    <div id="pincodeStatus" style="margin-top: 8px; font-size: 13px; display: none;"></div>
                </div>
                <div class="form-group">
                    <label>
                        <i class="fas fa-map-marker-alt"></i>
                        Delivery Address
                    </label>
                    <textarea id="customerAddress" required placeholder="Enter your complete address (house no, street, landmark)" rows="3" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; color: var(--cream-white); font-family: 'Poppins', sans-serif; resize: vertical;"></textarea>
                </div>

                <!-- Payment Method Section -->
                <div style="margin: 25px 0 20px 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                        <i class="fas fa-credit-card" style="color: var(--primary-gold); font-size: 18px;"></i>
                        <span style="color: var(--primary-gold); font-weight: 600; font-size: 16px;">Payment Method</span>
                    </div>
                    
                    <!-- Cash on Delivery Option -->
                    <div class="payment-option" id="paymentCOD" onclick="selectPaymentMethod('cod')" style="background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%); border: 2px solid #4CAF50; border-radius: 12px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.3s ease; position: relative;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #4CAF50; display: flex; align-items: center; justify-content: center; background: #4CAF50;">
                                <i class="fas fa-check" style="color: white; font-size: 12px;"></i>
                            </div>
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4CAF50, #45a049); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-money-bill-wave" style="color: white; font-size: 16px;"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="color: #4CAF50; font-weight: 600; font-size: 15px;">Cash on Delivery</div>
                                <div style="color: var(--light-gold); font-size: 12px; opacity: 0.8;">Pay when delivered</div>
                            </div>
                            <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; font-size: 10px; font-weight: 600; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">Recommended</div>
                        </div>
                        <input type="radio" name="paymentMethod" value="cod" checked style="display: none;">
                    </div>

                    <!-- UPI QR Code Option -->
                    <div class="payment-option" id="paymentUPI" onclick="selectPaymentMethod('upi')" style="background: rgba(40, 40, 40, 0.6); border: 2px solid rgba(80, 80, 80, 0.5); border-radius: 12px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.3s ease;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(100, 100, 100, 0.6); display: flex; align-items: center; justify-content: center;" id="upiRadio">
                            </div>
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6739B7, #4A148C); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-qrcode" style="color: white; font-size: 16px;"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="color: #B388FF; font-weight: 600; font-size: 15px;">UPI QR Code</div>
                                <div style="color: var(--light-gold); font-size: 12px; opacity: 0.8;">Scan & pay with any UPI app</div>
                            </div>
                        </div>
                        <input type="radio" name="paymentMethod" value="upi" style="display: none;">
                    </div>

                    <!-- Razorpay Option -->
                    <div class="payment-option" id="paymentRazorpay" onclick="selectPaymentMethod('razorpay')" style="background: rgba(40, 40, 40, 0.6); border: 2px solid rgba(80, 80, 80, 0.5); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.3s ease;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(100, 100, 100, 0.6); display: flex; align-items: center; justify-content: center;" id="razorpayRadio">
                            </div>
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #528FF0, #1565C0); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-wallet" style="color: white; font-size: 16px;"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="color: #64B5F6; font-weight: 600; font-size: 15px;">Razorpay</div>
                                <div style="color: var(--light-gold); font-size: 12px; opacity: 0.8;">Card, UPI, NetBanking, Wallets</div>
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <i class="fab fa-cc-visa" style="color: #1A1F71; font-size: 18px;"></i>
                                <i class="fab fa-cc-mastercard" style="color: #EB001B; font-size: 18px;"></i>
                            </div>
                        </div>
                        <input type="radio" name="paymentMethod" value="razorpay" style="display: none;">
                    </div>
                </div>

                <input type="hidden" id="selectedPaymentMethod" value="cod">

                <!-- Continue Button -->
                <button type="submit" class="submit-btn" id="placeOrderBtn" disabled style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 50%, #E65100 100%); border: none; width: 100%; padding: 16px; border-radius: 30px; font-size: 16px; font-weight: 600; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(255, 152, 0, 0.4);">
                    <i class="fas fa-check-circle"></i>
                    <span>Verify Pincode First</span>
                </button>
                <p id="deliveryNote" style="text-align: center; color: var(--light-gold); font-size: 12px; margin-top: 10px; display: none;">
                    <i class="fas fa-info-circle"></i> Enter your pincode to check delivery availability
                </p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Pre-fill if user data exists
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userPincode = localStorage.getItem('userPincode');
    const savedAddress = localStorage.getItem('savedAddress');

    if (user.name) {
        const nameInput = document.getElementById('customerName');
        nameInput.value = user.name;
        nameInput.readOnly = true;
        nameInput.style.opacity = '0.7';
        nameInput.style.cursor = 'not-allowed';
    }
    if (user.email) {
        const emailInput = document.getElementById('customerEmail');
        emailInput.value = user.email;
        emailInput.readOnly = true;
        emailInput.style.opacity = '0.7';
        emailInput.style.cursor = 'not-allowed';
    }
    if (user.phone) document.getElementById('customerPhone').value = user.phone;
    if (userPincode) {
        document.getElementById('customerPincode').value = userPincode;
        validateDeliveryPincode(userPincode);
    }
    if (savedAddress) document.getElementById('customerAddress').value = savedAddress;

    // Show delivery note
    document.getElementById('deliveryNote').style.display = 'block';

    // Add hover effects for payment options
    addPaymentOptionHoverEffects();
}

// ===== VALIDATE DELIVERY PINCODE =====
let pincodeValidationTimeout = null;
let lastValidatedPincode = '';
let isPincodeDeliverable = false;

async function validateDeliveryPincode(pincode) {
    const pincodeStatus = document.getElementById('pincodeStatus');
    const pincodeLoader = document.getElementById('pincodeLoader');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const deliveryNote = document.getElementById('deliveryNote');

    // Clear previous timeout
    if (pincodeValidationTimeout) {
        clearTimeout(pincodeValidationTimeout);
    }

    // Reset state
    isPincodeDeliverable = false;

    // Only validate if pincode is 6 digits
    if (pincode.length !== 6) {
        pincodeStatus.style.display = 'none';
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>Verify Pincode First</span>';
        if (deliveryNote) deliveryNote.style.display = 'block';
        return;
    }

    // Debounce the API call
    pincodeValidationTimeout = setTimeout(async () => {
        try {
            // Show loader
            pincodeLoader.style.display = 'block';
            pincodeStatus.style.display = 'none';

            const response = await fetch(`${getApiUrl()}/delivery/validate-pincode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pincode })
            });

            const result = await response.json();

            // Hide loader
            pincodeLoader.style.display = 'none';
            pincodeStatus.style.display = 'block';

            if (result.success && result.deliverable) {
                // Deliverable
                isPincodeDeliverable = true;
                lastValidatedPincode = pincode;
                pincodeStatus.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; color: #4CAF50;">
                        <i class="fas fa-check-circle"></i>
                        <span>${result.message}</span>
                    </div>
                `;
                pincodeStatus.style.color = '#4CAF50';

                // Calculate total for button
                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                placeOrderBtn.disabled = false;
                placeOrderBtn.innerHTML = `<i class="fas fa-check-circle"></i><span>Place Order - ₹${total}</span>`;
                if (deliveryNote) deliveryNote.style.display = 'none';

                // Auto-fill area in address if empty
                const addressField = document.getElementById('customerAddress');
                if (addressField && !addressField.value && result.area) {
                    addressField.placeholder = `Enter your address in ${result.area}`;
                }
            } else {
                // Not deliverable
                isPincodeDeliverable = false;
                pincodeStatus.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; color: #ff6b6b;">
                        <i class="fas fa-times-circle"></i>
                        <span>${result.message || 'Delivery not available in this area'}</span>
                    </div>
                `;
                pincodeStatus.style.color = '#ff6b6b';

                placeOrderBtn.disabled = true;
                placeOrderBtn.innerHTML = '<i class="fas fa-times-circle"></i><span>Delivery Unavailable</span>';
                if (deliveryNote) {
                    deliveryNote.innerHTML = '<i class="fas fa-info-circle"></i> Please enter a pincode within our delivery area';
                    deliveryNote.style.display = 'block';
                }
            }

        } catch (error) {
            console.error('Error validating pincode:', error);
            pincodeLoader.style.display = 'none';
            pincodeStatus.style.display = 'block';
            pincodeStatus.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #ffa500;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Could not verify pincode. Please try again.</span>
                </div>
            `;

            // Allow order even if validation fails (fallback)
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            isPincodeDeliverable = true; // Allow as fallback
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = `<i class="fas fa-check-circle"></i><span>Place Order - ₹${total}</span>`;
        }
    }, 500); // 500ms debounce
}

// Make function global
window.validateDeliveryPincode = validateDeliveryPincode;

// ===== CLOSE CHECKOUT MODAL =====
function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.remove();
    }
}

// ===== PAYMENT METHOD SELECTION =====
let selectedPaymentMethod = 'cod';

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.getElementById('selectedPaymentMethod').value = method;

    // Update all payment options UI
    const paymentOptions = {
        cod: { element: 'paymentCOD', color: '#4CAF50', borderColor: '#4CAF50' },
        upi: { element: 'paymentUPI', color: '#B388FF', borderColor: '#6739B7' },
        razorpay: { element: 'paymentRazorpay', color: '#64B5F6', borderColor: '#528FF0' }
    };

    // Reset all options
    Object.keys(paymentOptions).forEach(key => {
        const option = document.getElementById(paymentOptions[key].element);
        if (option) {
            if (key === method) {
                // Selected state
                option.style.background = `linear-gradient(135deg, rgba(${hexToRgb(paymentOptions[key].color)}, 0.15) 0%, rgba(${hexToRgb(paymentOptions[key].color)}, 0.05) 100%)`;
                option.style.borderColor = paymentOptions[key].borderColor;

                // Update radio indicator
                const radioDiv = option.querySelector('div[style*="border-radius: 50%"]');
                if (radioDiv) {
                    radioDiv.style.background = paymentOptions[key].color;
                    radioDiv.style.borderColor = paymentOptions[key].color;
                    radioDiv.innerHTML = '<i class="fas fa-check" style="color: white; font-size: 12px;"></i>';
                }
            } else {
                // Unselected state
                option.style.background = 'rgba(40, 40, 40, 0.6)';
                option.style.borderColor = 'rgba(80, 80, 80, 0.5)';

                // Update radio indicator
                const radioDiv = option.querySelector('div[style*="border-radius: 50%"]');
                if (radioDiv) {
                    radioDiv.style.background = 'transparent';
                    radioDiv.style.borderColor = 'rgba(100, 100, 100, 0.6)';
                    radioDiv.innerHTML = '';
                }
            }
        }
    });

    // Update button text based on payment method
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        if (method === 'cod') {
            placeOrderBtn.innerHTML = `<i class="fas fa-check-circle"></i><span>Place Order - ₹${total}</span>`;
        } else if (method === 'upi') {
            placeOrderBtn.innerHTML = `<i class="fas fa-qrcode"></i><span>Continue to Pay - ₹${total}</span>`;
        } else if (method === 'razorpay') {
            placeOrderBtn.innerHTML = `<i class="fas fa-lock"></i><span>Pay Securely - ₹${total}</span>`;
        }
    }
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '76, 175, 80'; // Default green
}

// Add hover effects for payment options
function addPaymentOptionHoverEffects() {
    const options = document.querySelectorAll('.payment-option');
    options.forEach(option => {
        option.addEventListener('mouseenter', function () {
            if (!this.style.borderColor.includes('4CAF50') &&
                !this.style.borderColor.includes('6739B7') &&
                !this.style.borderColor.includes('528FF0')) {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            }
        });
        option.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
}

// Make functions global
window.selectPaymentMethod = selectPaymentMethod;
window.addPaymentOptionHoverEffects = addPaymentOptionHoverEffects;

// ===== SUBMIT ORDER =====
async function submitOrder(event) {
    event.preventDefault();

    // Check if pincode was validated
    if (!isPincodeDeliverable) {
        if (typeof window.showToast === 'function') {
            window.showToast('Please enter a valid pincode for delivery', 'error');
        }
        return;
    }

    // Get customer details from form fields
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerPincode = document.getElementById('customerPincode').value;
    const customerAddress = document.getElementById('customerAddress').value;

    // Validate all required fields
    if (!customerName || !customerEmail || !customerPhone || !customerPincode || !customerAddress) {
        if (typeof window.showToast === 'function') {
            window.showToast('Please fill in all required fields', 'error');
        }
        return;
    }

    // Validate address length
    if (customerAddress.trim().length < 10) {
        if (typeof window.showToast === 'function') {
            window.showToast('Please enter a complete delivery address', 'error');
        }
        return;
    }

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Store customer data temporarily
    const orderData = {
        user: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            pincode: customerPincode,
            address: customerAddress
        },
        items: cart.map(item => ({
            menuItemId: item.id || item._id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        totalAmount: total,
        paymentMethod: selectedPaymentMethod,
        orderStatus: 'pending'
    };

    // Save customer data for future orders
    localStorage.setItem('userPincode', customerPincode);
    localStorage.setItem('savedAddress', customerAddress);

    // Get selected payment method BEFORE closing modal (read from hidden input as primary source)
    const paymentMethodInput = document.getElementById('selectedPaymentMethod');
    const paymentMethod = paymentMethodInput ? paymentMethodInput.value : selectedPaymentMethod;

    console.log('Payment method from variable:', selectedPaymentMethod);
    console.log('Payment method from input:', paymentMethodInput?.value);
    console.log('Final payment method:', paymentMethod);

    // Update orderData with the correct payment method
    orderData.paymentMethod = paymentMethod;

    // Close checkout modal
    closeCheckoutModal();

    // Process based on payment method
    if (paymentMethod === 'cod') {
        // Cash on Delivery - Process order directly
        console.log('Processing COD order...');
        processCODOrder(orderData);
    } else if (paymentMethod === 'upi') {
        // UPI QR Code - Show QR modal
        console.log('Processing UPI order...');
        showQRPaymentModal(orderData);
    } else if (paymentMethod === 'razorpay') {
        // Razorpay - Initialize payment
        console.log('Processing Razorpay order...');
        processRazorpayPayment(orderData);
    } else {
        // Default to COD if unknown
        console.log('Unknown payment method, defaulting to COD...');
        processCODOrder(orderData);
    }
}

// ===== PROCESS COD ORDER =====
async function processCODOrder(orderData) {
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    let orderId;
    let orderSavedToBackend = false;

    try {
        const response = await fetch(`${getApiUrl()}/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                deliveryAddress: orderData.user.address,
                paymentMethod: 'cash_on_delivery',
                items: orderData.items,
                totalAmount: orderData.totalAmount
            })
        });

        if (response.ok) {
            const result = await response.json();
            orderId = result.order?.orderId || result.data?.orderId || ('ORD' + Date.now());
            orderSavedToBackend = true;

            if (typeof window.showToast === 'function') {
                window.showToast(`✅ Order ${orderId} placed successfully!`);
            }
        } else {
            throw new Error('Failed to create order');
        }
    } catch (error) {
        console.error('Error creating COD order:', error);
        orderId = 'ORD' + Date.now();
        orderSavedToBackend = false;

        if (typeof window.showToast === 'function') {
            window.showToast('⚠️ Order created offline - ' + orderId);
        }
    }

    // Clear cart and show confirmation
    cart = [];
    saveCartToStorage();
    updateCartUI();
    updateCartDisplay();
    document.getElementById('cartSidebar')?.classList.remove('active');

    showOrderConfirmationWithTracking(orderId, orderData, orderSavedToBackend, true);
}

// ===== PROCESS RAZORPAY PAYMENT =====
async function processRazorpayPayment(orderData) {
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');

    try {
        // First create the order in backend
        const orderResponse = await fetch(`${getApiUrl()}/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                deliveryAddress: orderData.user.address,
                paymentMethod: 'razorpay',
                items: orderData.items,
                totalAmount: orderData.totalAmount
            })
        });

        if (!orderResponse.ok) {
            throw new Error('Failed to create order');
        }

        const orderResult = await orderResponse.json();
        const orderId = orderResult.order?.orderId || orderResult.data?.orderId;

        // Create Razorpay order
        const razorpayResponse = await fetch(`${getApiUrl()}/payment/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                amount: orderData.totalAmount,
                orderId: orderId
            })
        });

        if (!razorpayResponse.ok) {
            const errorData = await razorpayResponse.json().catch(() => ({}));
            if (errorData.notConfigured) {
                throw new Error('Razorpay is not configured. Please contact support or use Cash on Delivery.');
            }
            throw new Error('Failed to create Razorpay order');
        }

        const razorpayData = await razorpayResponse.json();

        // Check if Razorpay SDK is loaded
        if (typeof Razorpay === 'undefined') {
            // Load Razorpay SDK dynamically
            await loadRazorpayScript();
        }

        // Configure Razorpay options
        const options = {
            key: razorpayData.data.key,
            amount: razorpayData.data.amount,
            currency: razorpayData.data.currency || 'INR',
            name: 'Curry Crave',
            description: `Order #${orderId}`,
            order_id: razorpayData.data.orderId,
            handler: async function (response) {
                // Payment successful - verify on backend
                try {
                    const verifyResponse = await fetch(`${getApiUrl()}/payment/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: orderId
                        })
                    });

                    if (verifyResponse.ok) {
                        // Payment verified successfully
                        cart = [];
                        saveCartToStorage();
                        updateCartUI();
                        updateCartDisplay();
                        document.getElementById('cartSidebar')?.classList.remove('active');

                        if (typeof window.showToast === 'function') {
                            window.showToast('🎉 Payment successful! Order confirmed.');
                        }

                        showOrderConfirmationWithTracking(orderId, orderData, true, true);
                    } else {
                        throw new Error('Payment verification failed');
                    }
                } catch (error) {
                    console.error('Payment verification error:', error);
                    if (typeof window.showToast === 'function') {
                        window.showToast('Payment verification failed. Please contact support.', 'error');
                    }
                }
            },
            prefill: {
                name: orderData.user.name,
                email: orderData.user.email,
                contact: orderData.user.phone
            },
            notes: {
                address: orderData.user.address
            },
            theme: {
                color: '#D4AF37'
            },
            modal: {
                ondismiss: async function () {
                    // Payment was cancelled by user - cancel the order
                    console.log('Payment cancelled by user, cancelling order:', orderId);
                    try {
                        await fetch(`${getApiUrl()}/order/${orderId}/cancel`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            }
                        });
                    } catch (cancelError) {
                        console.error('Error cancelling order:', cancelError);
                    }

                    // Show payment failed modal
                    showPaymentFailedModal('Payment was cancelled. Your order has been cancelled.');
                }
            }
        };

        const razorpay = new Razorpay(options);

        // Handle payment failure
        razorpay.on('payment.failed', async function (response) {
            console.log('Payment failed:', response.error);

            // Cancel the order in backend
            try {
                await fetch(`${getApiUrl()}/payment/failed`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        orderId: orderId,
                        error: response.error.description || 'Payment failed'
                    })
                });
            } catch (failError) {
                console.error('Error marking payment as failed:', failError);
            }

            // Show payment failed modal
            showPaymentFailedModal(response.error.description || 'Payment failed. Please try again.');
        });

        razorpay.open();

    } catch (error) {
        console.error('Razorpay payment error:', error);
        // Show payment failed modal instead of just a toast
        showPaymentFailedModal(error.message || 'Payment initialization failed. Please try again.');
    }
}

// ===== SHOW PAYMENT FAILED MODAL =====
function showPaymentFailedModal(errorMessage) {
    // Remove any existing modal
    const existingModal = document.getElementById('paymentFailedModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'paymentFailedModal';
    modal.className = 'login-modal active';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="max-width: 450px; text-align: center;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(255, 50, 50, 0.2) 0%, rgba(255, 50, 50, 0.1) 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <i class="fas fa-times-circle" style="font-size: 40px; color: #ff6b6b;"></i>
            </div>
            <h2 class="modal-title" style="color: #ff6b6b;">Payment Failed</h2>
            <p style="color: var(--light-gold); margin: 20px 0; font-size: 15px;">
                ${errorMessage}
            </p>
            <div style="background: rgba(255, 50, 50, 0.1); border: 1px solid rgba(255, 50, 50, 0.3); border-radius: 12px; padding: 15px; margin: 20px 0;">
                <p style="color: var(--cream-white); font-size: 14px; margin: 0;">
                    <i class="fas fa-info-circle" style="color: #ff6b6b; margin-right: 8px;"></i>
                    Your order was not placed. No amount has been deducted.
                </p>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 25px;">
                <button onclick="closePaymentFailedModal()" class="submit-btn" style="flex: 1; background: rgba(100, 100, 100, 0.3); border: 1px solid rgba(150, 150, 150, 0.5);">
                    <i class="fas fa-times"></i>
                    <span>Close</span>
                </button>
                <button onclick="closePaymentFailedModal(); handleCheckout();" class="submit-btn" style="flex: 1; background: linear-gradient(135deg, var(--primary-gold) 0%, var(--secondary-gold) 100%);">
                    <i class="fas fa-redo"></i>
                    <span>Try Again</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closePaymentFailedModal() {
    const modal = document.getElementById('paymentFailedModal');
    if (modal) modal.remove();
}

// Make functions global
window.showPaymentFailedModal = showPaymentFailedModal;
window.closePaymentFailedModal = closePaymentFailedModal;

// ===== LOAD RAZORPAY SCRIPT =====
function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (typeof Razorpay !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ===== SHOW QR PAYMENT MODAL =====
function showQRPaymentModal(orderData) {
    const modal = document.createElement('div');
    modal.id = 'qrPaymentModal';
    modal.className = 'login-modal active';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <h2 class="modal-title">Scan QR Code to Pay</h2>
            <p style="color: var(--light-gold); margin-bottom: 20px;">
                Amount: ₹${orderData.totalAmount}
            </p>
            <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; margin: 20px auto;">
                <img src="assets/images/payment-qr.png" alt="Payment QR Code" style="width: 250px; height: 250px; display: block;">
            </div>
            <p style="color: var(--cream-white); margin-top: 20px; font-size: 14px;">
                <i class="fas fa-info-circle"></i> Scan this QR code using any UPI app
            </p>
            <div style="margin-top: 30px; padding: 15px; background: rgba(212, 175, 55, 0.1); border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.3);">
                <p style="color: var(--primary-gold); font-size: 16px; margin-bottom: 10px;">
                    <i class="fas fa-clock"></i> Waiting for payment...
                </p>
                <div style="font-size: 24px; color: var(--cream-white); font-weight: 600;" id="paymentTimer">60</div>
                <p style="color: var(--light-gold); font-size: 12px; margin-top: 5px;">seconds remaining</p>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="cancelPayment()" class="submit-btn" style="background: rgba(255, 50, 50, 0.2); border-color: var(--vibrant-red); flex: 1;">
                    <i class="fas fa-times"></i>
                    <span>Cancel</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Start 60-second timer
    startPaymentTimer(orderData);
}

// ===== START PAYMENT TIMER =====
function startPaymentTimer(orderData) {
    let timeRemaining = 60;
    const timerElement = document.getElementById('paymentTimer');

    const timerInterval = setInterval(() => {
        timeRemaining--;
        if (timerElement) {
            timerElement.textContent = timeRemaining;
        }

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            // Process the order after 60 seconds
            processPaymentAndOrder(orderData);
        }
    }, 1000);

    // Store interval ID for cleanup if needed
    window.currentPaymentTimer = timerInterval;
}

// ===== PROCESS PAYMENT AND ORDER =====
async function processPaymentAndOrder(orderData) {
    let orderId;
    let orderSavedToBackend = false;
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    const isAuthenticated = authToken && authToken !== 'null' && !authToken.startsWith('demo-token-');

    try {
        let response;

        // Create authenticated order (mandatory since login is required)
        response = await fetch(`${getApiUrl()}/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                deliveryAddress: orderData.user.address,
                paymentMethod: 'cash_on_delivery',
                items: orderData.items,
                totalAmount: orderData.totalAmount
            })
        });

        if (response.ok) {
            const result = await response.json();
            // Handle both response structures
            orderId = result.order?.orderId || result.data?.orderId || ('ORD' + Date.now());
            orderSavedToBackend = true;

            if (typeof window.showToast === 'function') {
                window.showToast(`✅ Order ${orderId} created successfully!`);
            }
        } else {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'Failed to create order');
        }
    } catch (error) {
        console.error('Backend error creating order:', error);
        // Generate a local order ID if backend fails
        orderId = 'ORD' + Date.now();
        orderSavedToBackend = false;

        if (typeof window.showToast === 'function') {
            window.showToast('⚠️ Order created offline - ' + orderId);
        }
    }

    // Save customer info for next time
    localStorage.setItem('userName', orderData.user.name);
    localStorage.setItem('userEmail', orderData.user.email);

    // Clear cart
    cart = [];
    saveCartToStorage();
    updateCartUI();
    updateCartDisplay();

    // Close payment modal
    closePaymentModal();
    document.getElementById('cartSidebar')?.classList.remove('active');

    // Show order confirmation with payment waiting message
    showOrderConfirmationWithTracking(orderId, orderData, orderSavedToBackend, isAuthenticated);
}

// ===== SHOW ORDER CONFIRMATION WITH TRACKING =====
function showOrderConfirmationWithTracking(orderId, orderData, orderSavedToBackend, isAuthenticated) {
    const modal = document.createElement('div');
    modal.id = 'orderConfirmationModal';
    modal.className = 'login-modal active';

    // Different button and message based on authentication status
    const actionButton = isAuthenticated ? `
        <p style="color: var(--vibrant-green); font-size: 16px; margin-bottom: 20px;">
            <i class="fas fa-shipping-fast"></i> Redirecting to order tracking...
        </p>
        
        <button onclick="redirectToOrderTracking()" class="submit-btn" style="width: 100%;">
            <i class="fas fa-map-marker-alt"></i>
            <span>Track Order Now</span>
        </button>
    ` : `
        <p style="color: var(--light-gold); font-size: 14px; margin-bottom: 20px;">
            <i class="fas fa-info-circle"></i> Login to track your order status
        </p>
        
        <button onclick="closeOrderConfirmation()" class="submit-btn" style="width: 100%;">
            <i class="fas fa-utensils"></i>
            <span>Back to Menu</span>
        </button>
    `;

    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50, #45a049); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3); animation: scaleIn 0.3s ease-out;">
                    <i class="fas fa-check" style="font-size: 40px; color: white;"></i>
                </div>
            </div>
            <h2 class="modal-title" style="color: #4CAF50; margin-bottom: 10px;">Order Confirmed!</h2>
            <p style="color: var(--cream-white); font-size: 18px; margin-bottom: 20px;">
                Your order has been successfully placed
            </p>
            <div style="background: rgba(212, 175, 55, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px solid rgba(212, 175, 55, 0.3);">
                <p style="color: var(--light-gold); font-size: 14px; margin-bottom: 5px;">Order ID</p>
                <p style="color: var(--primary-gold); font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace;">${orderId}</p>
            </div>
            
            <div style="background: rgba(255, 165, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(255, 165, 0, 0.3);">
                <p style="color: #FFA500; font-size: 16px; margin: 0;">
                    <i class="fas fa-clock"></i> ${orderSavedToBackend ? 'Order Confirmed' : 'Order Created'}
                </p>
                <p style="color: var(--light-gold); font-size: 14px; margin-top: 8px;">
                    ${orderSavedToBackend ? 'Your order is being prepared!' : 'Order saved locally'}
                </p>
            </div>

            <div style="text-align: left; background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: var(--light-gold); margin-bottom: 10px;"><i class="fas fa-user"></i> ${orderData.user.name}</p>
                <p style="color: var(--light-gold); margin-bottom: 10px;"><i class="fas fa-envelope"></i> ${orderData.user.email}</p>
                <p style="color: var(--light-gold); margin-bottom: 10px;"><i class="fas fa-phone"></i> ${orderData.user.phone}</p>
                <p style="color: var(--light-gold);"><i class="fas fa-map-marker-alt"></i> ${orderData.user.address}</p>
            </div>
            
            ${actionButton}
        </div>
    `;

    document.body.appendChild(modal);

    // Show success toast
    if (typeof window.showToast === 'function') {
        window.showToast(`🎉 Order confirmed! Order ID: ${orderId}`);
    }

    // Auto-redirect to tracking after 3 seconds (only for authenticated users)
    if (isAuthenticated) {
        setTimeout(() => {
            redirectToOrderTracking();
        }, 3000);
    }
}

// ===== REDIRECT TO ORDER TRACKING =====
function redirectToOrderTracking() {
    // Close the confirmation modal
    closeOrderConfirmation();

    // Open order tracking modal
    if (typeof window.openOrderTracking === 'function') {
        window.openOrderTracking();
    } else {
        // Fallback: try to click the track order button
        document.getElementById('trackOrderBtn')?.click();
    }
}

// ===== SHOW ORDER CONFIRMATION (Legacy function - kept for compatibility) =====
function showOrderConfirmation(orderId, orderData) {
    const modal = document.createElement('div');
    modal.id = 'orderConfirmationModal';
    modal.className = 'login-modal active';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50, #45a049); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3); animation: scaleIn 0.3s ease-out;">
                    <i class="fas fa-check" style="font-size: 40px; color: white;"></i>
                </div>
            </div>
            <h2 class="modal-title" style="color: #4CAF50; margin-bottom: 10px;">Order Confirmed!</h2>
            <p style="color: var(--cream-white); font-size: 18px; margin-bottom: 30px;">
                Your order has been successfully placed
            </p>
            <div style="background: rgba(212, 175, 55, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px solid rgba(212, 175, 55, 0.3);">
                <p style="color: var(--light-gold); font-size: 14px; margin-bottom: 5px;">Order ID</p>
                <p style="color: var(--primary-gold); font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace;">${orderId}</p>
            </div>
            <div style="text-align: left; background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: var(--light-gold); margin-bottom: 10px;"><i class="fas fa-user"></i> ${orderData.user.name}</p>
                <p style="color: var(--light-gold); margin-bottom: 10px;"><i class="fas fa-envelope"></i> ${orderData.user.email}</p>
                <p style="color: var(--light-gold); margin-bottom: 10px;"><i class="fas fa-phone"></i> ${orderData.user.phone}</p>
                <p style="color: var(--light-gold);"><i class="fas fa-map-marker-alt"></i> ${orderData.user.address}</p>
            </div>
            <p style="color: var(--cream-white); font-size: 16px; margin-bottom: 20px;">
                <i class="fas fa-motorcycle"></i> Your delicious food will be delivered soon!
            </p>
            <p style="color: var(--light-gold); font-size: 14px; margin-bottom: 30px;">
                We'll send updates to ${orderData.user.email}
            </p>
            <button onclick="closeOrderConfirmation()" class="submit-btn" style="width: 100%;">
                <i class="fas fa-home"></i>
                <span>Back to Home</span>
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Show success toast
    if (typeof window.showToast === 'function') {
        window.showToast(`🎉 Order placed successfully! Order ID: ${orderId}`);
    }
}

// ===== CANCEL PAYMENT =====
function cancelPayment() {
    if (window.currentPaymentTimer) {
        clearInterval(window.currentPaymentTimer);
    }
    closePaymentModal();

    if (typeof window.showToast === 'function') {
        window.showToast('Payment cancelled');
    }
}

// ===== CLOSE PAYMENT MODAL =====
function closePaymentModal() {
    if (window.currentPaymentTimer) {
        clearInterval(window.currentPaymentTimer);
    }
    const modal = document.getElementById('qrPaymentModal');
    if (modal) {
        modal.remove();
    }
}

// ===== CLOSE ORDER CONFIRMATION =====
function closeOrderConfirmation() {
    const modal = document.getElementById('orderConfirmationModal');
    if (modal) {
        modal.remove();
    }
}

// ===== LOCAL STORAGE =====
function saveCartToStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving cart to storage:', error);
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (error) {
        console.error('Error loading cart from storage:', error);
        cart = [];
    }
}

// ===== CLEAR CART =====
function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCartToStorage();
        updateCartUI();
        updateCartDisplay();

        if (typeof window.showToast === 'function') {
            window.showToast('Cart cleared');
        }
    }
}

// Make functions globally accessible
window.addItemToCart = addItemToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.closeCheckoutModal = closeCheckoutModal;
window.submitOrder = submitOrder;
window.cancelPayment = cancelPayment;
window.closeOrderConfirmation = closeOrderConfirmation;
window.redirectToOrderTracking = redirectToOrderTracking;
window.processCODOrder = processCODOrder;
window.processRazorpayPayment = processRazorpayPayment;
window.loadRazorpayScript = loadRazorpayScript;
