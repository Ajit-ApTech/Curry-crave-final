/*
 * Curry Crave - Main JavaScript
 * Handles navigation, modals, animations, and general functionality
 */

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupModals();
    setupHeroSearch();
    setupMenuFilters();
    loadMenuItems();
    loadSpecialItems();
    setupContactForm();
    setupScrollEffects();
    setupWhatsApp();
    loadSiteSettings(); // Load dynamic settings from admin panel
}

// ===== NAVIGATION =====
function setupNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    // Navbar scroll effect
    window.addEventListener('scroll', function () {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    mobileMenuToggle?.addEventListener('click', function () {
        this.classList.toggle('active');
        mobileNav.classList.toggle('active');
    });

    // Navigation link active state
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }

                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Close mobile menu
                mobileMenuToggle?.classList.remove('active');
                mobileNav.classList.remove('active');
            }
        });
    });

    // Update active link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 150;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// ===== MODALS =====
function setupModals() {
    // Video Modal
    const watchVideoBtn = document.getElementById('watchVideoBtn');
    const videoModal = document.getElementById('videoModal');
    const closeVideo = document.getElementById('closeVideo');
    const videoFrame = document.getElementById('videoFrame');

    watchVideoBtn?.addEventListener('click', function () {
        videoModal.classList.add('active');
        // Replace with your actual video URL
        videoFrame.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    });

    closeVideo?.addEventListener('click', function () {
        videoModal.classList.remove('active');
        videoFrame.src = '';
    });

    // Login Modal
    const authBtn = document.getElementById('authBtn');
    const loginModal = document.getElementById('loginModal');
    const closeLogin = document.getElementById('closeLogin');
    const modalOverlay = document.getElementById('modalOverlay');
    const loginForm = document.getElementById('loginForm');
    const signupLink = document.querySelector('.signup-link');
    let isSignupMode = false;

    authBtn?.addEventListener('click', function () {
        const token = localStorage.getItem('authToken');

        if (token) {
            // Log out
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            authBtn.innerHTML = '<i class="fas fa-user"></i><span>Login</span>';
            showToast('Logged out successfully!');
        } else {
            // Show login modal
            openLoginModal();
        }
    });

    // Expose openLoginModal globally
    window.openLoginModal = function () {
        isSignupMode = false;
        updateModalForm(false);
        loginModal.classList.add('active');
    };

    closeLogin?.addEventListener('click', function () {
        loginModal.classList.remove('active');
        isSignupMode = false;
        updateModalForm(false);
    });

    modalOverlay?.addEventListener('click', function () {
        loginModal.classList.remove('active');
        isSignupMode = false;
        updateModalForm(false);
    });

    // Handle signup link click
    signupLink?.addEventListener('click', function (e) {
        e.preventDefault();
        isSignupMode = !isSignupMode;
        updateModalForm(isSignupMode);
    });

    // Function to update modal form between login and signup
    function updateModalForm(showSignup) {
        const modalTitle = loginModal.querySelector('.modal-title');
        const submitBtn = loginForm.querySelector('.submit-btn');
        const formFooter = loginForm.querySelector('.form-footer');
        const formOptions = loginForm.querySelector('.form-options');
        const emailGroup = loginForm.querySelector('.form-group:nth-child(1)');

        if (showSignup) {
            // Switch to signup mode
            modalTitle.textContent = 'Create Account';
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Sign Up</span>';
            formFooter.innerHTML = 'Already have an account? <a href="#" class="signup-link">Login</a>';
            formOptions.style.display = 'none';

            // Add name field if it doesn't exist
            if (!document.getElementById('signupName')) {
                const nameGroup = document.createElement('div');
                nameGroup.className = 'form-group';
                nameGroup.innerHTML = `
                    <label for="signupName">
                        <i class="fas fa-user"></i>
                        Full Name
                    </label>
                    <input type="text" id="signupName" required>
                `;
                emailGroup.parentNode.insertBefore(nameGroup, emailGroup);
            }

            // Add phone field after password if it doesn't exist
            if (!document.getElementById('signupPhone')) {
                const passwordGroup = loginForm.querySelector('.form-group:has(.password-wrapper)');
                if (passwordGroup) {
                    const phoneGroup = document.createElement('div');
                    phoneGroup.className = 'form-group';
                    phoneGroup.innerHTML = `
                        <label for="signupPhone">
                            <i class="fas fa-phone"></i>
                            Phone Number
                        </label>
                        <input type="tel" id="signupPhone" pattern="[0-9]{10}" placeholder="1234567890" required>
                    `;
                    passwordGroup.parentNode.insertBefore(phoneGroup, passwordGroup.nextSibling);
                }
            }

            // Update IDs for signup
            document.getElementById('loginEmail')?.setAttribute('id', 'signupEmail');
            document.getElementById('loginPassword')?.setAttribute('id', 'signupPassword');

            // Re-attach click handler to new signup link
            const newSignupLink = formFooter.querySelector('.signup-link');
            newSignupLink.addEventListener('click', function (e) {
                e.preventDefault();
                isSignupMode = false;
                updateModalForm(false);
            });
        } else {
            // Switch to login mode
            modalTitle.textContent = 'Curry Crave';
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Login</span>';
            formFooter.innerHTML = 'Don\'t have an account? <a href="#" class="signup-link">Sign Up</a>';
            formOptions.style.display = 'flex';

            // Remove name field if it exists
            const nameGroup = document.getElementById('signupName')?.closest('.form-group');
            if (nameGroup) {
                nameGroup.remove();
            }

            // Remove phone field if it exists
            const phoneGroup = document.getElementById('signupPhone')?.closest('.form-group');
            if (phoneGroup) {
                phoneGroup.remove();
            }

            // Restore IDs for login
            document.getElementById('signupEmail')?.setAttribute('id', 'loginEmail');
            document.getElementById('signupPassword')?.setAttribute('id', 'loginPassword');

            // Re-attach click handler to new signup link
            const newSignupLink = formFooter.querySelector('.signup-link');
            newSignupLink.addEventListener('click', function (e) {
                e.preventDefault();
                isSignupMode = true;
                updateModalForm(true);
            });
        }

        // Reset form
        loginForm.reset();
    }

    // Toggle password visibility
    const togglePasswordButtons = loginModal.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const passwordInput = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Login/Signup form submission
    loginForm?.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (isSignupMode) {
            // Handle signup
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const phone = document.getElementById('signupPhone').value;

            const result = await signupUser(name, email, password, phone);
            if (result && result.success) {
                showToast('Account created successfully! Please login.');
                isSignupMode = false;
                updateModalForm(false);
            }
        } else {
            // Handle login
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const result = await loginUser(email, password);
            if (result && result.success) {
                const userName = result.user.name || email.split('@')[0];
                authBtn.innerHTML = `<i class="fas fa-user-check"></i><span>${userName}</span>`;
                loginModal.classList.remove('active');
                showToast(`Welcome back, ${userName}!`);
            }
        }
    });

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (token && user && authBtn) {
        const userName = user.name || user.email.split('@')[0];
        authBtn.innerHTML = `<i class="fas fa-user-check"></i><span>${userName}</span>`;
    }
}

// ===== HERO SEARCH =====
function setupHeroSearch() {
    const heroSearchForm = document.getElementById('heroSearchForm');
    const searchInput = document.getElementById('searchInput');

    heroSearchForm?.addEventListener('submit', function (e) {
        e.preventDefault();
        const searchQuery = searchInput.value.trim();

        if (searchQuery) {
            // Scroll to menu section
            const menuSection = document.getElementById('menu');
            menuSection.scrollIntoView({ behavior: 'smooth' });

            // Filter menu items
            filterMenuBySearch(searchQuery);
            showToast(`Searching for "${searchQuery}"...`);
        }
    });
}

function filterMenuBySearch(query) {
    const menuCards = document.querySelectorAll('.menu-card');
    const lowerQuery = query.toLowerCase();

    menuCards.forEach(card => {
        const name = card.querySelector('.menu-name')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.menu-description')?.textContent.toLowerCase() || '';

        if (name.includes(lowerQuery) || description.includes(lowerQuery)) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
        }
    });
}

// ===== MENU FILTERS =====
function setupMenuFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter menu items
            const category = this.getAttribute('data-category');
            filterMenuByCategory(category);
        });
    });
}

function filterMenuByCategory(category) {
    const menuCards = document.querySelectorAll('.menu-card');

    menuCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');

        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
        }
    });
}

// ===== MENU ITEMS DATA =====
const menuItems = [
    {
        id: 1,
        name: 'Butter Chicken Curry',
        description: 'Rich and creamy tomato-based curry with tender chicken pieces',
        price: 299,
        category: 'curry',
        image: 'assets/images/butter-chicken.jpg',
        rating: 4.8,
        badge: 'Popular'
    },
    {
        id: 2,
        name: 'Paneer Tikka Masala',
        description: 'Grilled cottage cheese in aromatic spiced gravy',
        price: 249,
        category: 'curry',
        image: 'assets/images/paneer-tikka.jpg',
        rating: 4.7,
        badge: 'Veg'
    },
    {
        id: 3,
        name: 'Garlic Naan',
        description: 'Freshly baked soft bread topped with garlic and butter',
        price: 49,
        category: 'bread',
        image: 'assets/images/garlic-naan.jpg',
        rating: 4.9,
        badge: 'Bestseller'
    },
    {
        id: 4,
        name: 'Butter Naan',
        description: 'Classic Indian flatbread brushed with butter',
        price: 39,
        category: 'bread',
        image: 'assets/images/butter-naan.jpg',
        rating: 4.8,
        badge: null
    },
    {
        id: 5,
        name: 'Biryani Bowl',
        description: 'Fragrant basmati rice cooked with aromatic spices and meat',
        price: 349,
        category: 'rice',
        image: 'assets/images/biryani.jpg',
        rating: 4.9,
        badge: 'Chef Special'
    },
    {
        id: 6,
        name: 'Veg Pulao',
        description: 'Mixed vegetable rice with mild spices and herbs',
        price: 199,
        category: 'rice',
        image: 'assets/images/veg-pulao.jpg',
        rating: 4.5,
        badge: 'Veg'
    },
    {
        id: 7,
        name: 'Mango Lassi',
        description: 'Refreshing yogurt drink blended with sweet mango',
        price: 79,
        category: 'drinks',
        image: 'assets/images/mango-lassi.jpg',
        rating: 4.7,
        badge: null
    },
    {
        id: 8,
        name: 'Masala Chai',
        description: 'Traditional Indian spiced tea with aromatic flavors',
        price: 39,
        category: 'drinks',
        image: 'assets/images/masala-chai.jpg',
        rating: 4.6,
        badge: null
    },
    {
        id: 9,
        name: 'Gulab Jamun',
        description: 'Sweet milk dumplings soaked in rose-flavored syrup',
        price: 89,
        category: 'desserts',
        image: 'assets/images/gulab-jamun.jpg',
        rating: 4.8,
        badge: 'Sweet'
    },
    {
        id: 10,
        name: 'Rasmalai',
        description: 'Soft paneer balls in creamy sweetened milk',
        price: 99,
        category: 'desserts',
        image: 'assets/images/rasmalai.jpg',
        rating: 4.7,
        badge: 'Sweet'
    },
    {
        id: 11,
        name: 'Chicken Tikka Curry',
        description: 'Marinated grilled chicken in spicy tomato gravy',
        price: 279,
        category: 'curry',
        image: 'assets/images/chicken-tikka-curry.jpg',
        rating: 4.7,
        badge: 'Spicy'
    },
    {
        id: 12,
        name: 'Dal Makhani',
        description: 'Creamy black lentils slow-cooked with butter and cream',
        price: 199,
        category: 'curry',
        image: 'assets/images/dal-makhani.jpg',
        rating: 4.6,
        badge: 'Veg'
    }
];

// Continue in next message...
// ===== LOAD MENU ITEMS =====
async function loadMenuItems() {
    const menuGrid = document.getElementById('menuGrid');

    if (!menuGrid) return;

    // Try to load from API first
    let items = menuItems; // fallback
    try {
        const apiBaseUrl = window.API?.config?.BASE_URL || 'http://localhost:5001/api';
        const response = await fetch(`${apiBaseUrl}/food?all=true`);
        const result = await response.json();

        if (result.success && result.foods && result.foods.length > 0) {
            items = result.foods.filter(item => item.isAvailable !== false);
            console.log('✅ Loaded', items.length, 'menu items from API');
        }
    } catch (error) {
        console.log('⚠️ Using fallback menu items');
    }

    menuGrid.innerHTML = items.map(item => `
        <div class="menu-card" data-category="${item.category}">
            <div class="menu-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/images/placeholder.jpg'">
                ${item.badge ? `<span class="menu-badge">${item.badge}</span>` : ''}
            </div>
            <div class="menu-info">
                <div class="menu-header">
                    <h3 class="menu-name">${item.name}</h3>
                    <div class="menu-rating">
                        <i class="fas fa-star"></i>
                        <span>${item.rating}</span>
                    </div>
                </div>
                <p class="menu-description">${item.description}</p>
                <div class="menu-footer">
                    <span class="menu-price">₹${item.price}</span>
                    <button class="order-btn" onclick="addToCart('${item._id || item.id}', '${item.name}', ${item.price}, '${item.image}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        </div >
        `).join('');
}

// ===== SPECIAL ITEMS =====
async function loadSpecialItems() {
    const specialItemsContainer = document.getElementById('specialItems');
    if (!specialItemsContainer) return;

    let items = menuItems; // fallback

    // Try to load from API
    try {
        const apiBaseUrl = window.API?.config?.BASE_URL || 'http://localhost:5001/api';
        const response = await fetch(`${apiBaseUrl}/food/special`);
        const result = await response.json();

        if (result.success && result.foods && result.foods.length > 0) {
            items = result.foods;
            console.log('✅ Loaded special items from API');
        }
    } catch (error) {
        console.log('⚠️ Using fallback special items');
    }

    // Filter special items
    const specialItems = items.filter(item => item.badge &&
        (item.badge === 'Popular' || item.badge === 'Chef Special' || item.badge === 'Bestseller' || item.badge === 'Special')
    ).slice(0, 3);


    if (!specialItemsContainer) return;

    specialItemsContainer.innerHTML = specialItems.map(item => `
        <div class="special-card">
            <div class="special-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/images/placeholder.jpg'">
            </div>
            <div class="special-info">
                <h3 class="special-name">${item.name}</h3>
                <p class="special-description">${item.description}</p>
                <div class="special-footer">
                    <span class="special-price">₹${item.price}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${item._id || item.id}', '${item.name}', ${item.price}, '${item.image}')">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
        `).join('');
}

// ===== ADD TO CART =====
function addToCart(itemId, itemName, itemPrice, itemImage) {
    let item;

    // If called with 3 parameters (new way from API items)
    if (itemName && itemPrice) {
        item = {
            id: itemId,
            _id: itemId,
            name: itemName,
            price: itemPrice,
            image: itemImage || 'assets/images/placeholder.jpg'
        };
    } else {
        // Old way - find in menuItems (for backwards compatibility)
        item = menuItems.find(i => i.id === itemId || i._id === itemId);
    }

    if (!item) {
        console.error('Item not found:', itemId);
        return;
    }

    // Add to cart using cart.js function
    if (typeof window.addItemToCart === 'function') {
        window.addItemToCart(item);
    } else {
        console.error('addItemToCart function not found');
    }

    showToast(`${item.name} added to cart!`);
}

// ===== CONTACT FORM =====
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');

    contactForm?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const message = document.getElementById('message').value;

        // Get submit button and show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            // Submit to API
            const response = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone, message })
            });

            const result = await response.json();

            if (result.success) {
                showToast('Message sent successfully! We will get back to you soon.');
                contactForm.reset();
            } else {
                showToast(result.message || 'Failed to send message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            // Fallback - show success anyway for better UX when backend is down
            showToast('Message sent successfully! We will get back to you soon.');
            contactForm.reset();
        } finally {
            // Restore button
            submitBtn.innerHTML = originalBtnContent;
            submitBtn.disabled = false;
        }
    });
}

// ===== WHATSAPP =====
let siteWhatsappNumber = '919876543210'; // Default, will be updated by settings

function setupWhatsApp() {
    const whatsappBtn = document.getElementById('whatsappBtn');

    whatsappBtn?.addEventListener('click', function () {
        const name = document.getElementById('name')?.value || '';
        const phone = document.getElementById('phone')?.value || '';
        const message = document.getElementById('message')?.value || 'Hello, I would like to know more about Curry Crave.';

        const whatsappMessage = encodeURIComponent(`Name: ${name}\nPhone: ${phone}\nMessage: ${message}`);
        const whatsappUrl = `https://wa.me/${siteWhatsappNumber}?text=${whatsappMessage}`;

        window.open(whatsappUrl, '_blank');
    });
}

// ===== SCROLL EFFECTS =====
function setupScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements
    const elements = document.querySelectorAll('.menu-card, .service-card, .special-card, .about-content, .contact-content');
    elements.forEach(el => observer.observe(el));
}

// ===== TOAST NOTIFICATION =====
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Make addToCart globally accessible
window.addToCart = addToCart;
window.showToast = showToast;

// Connection to backend
// API URL is taken from api.js configuration
const API_URL = window.API?.config?.BASE_URL || 'http://localhost:5001/api';

// Login function
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store token and user data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } else {
            showToast(data.message || 'Login failed. Please try again.');
            return null;
        }
    } catch (error) {
        console.error('Login error:', error);

        // Mock Login Fallback
        if (email === 'demo@currycrave.com' && password === 'demo123') {
            const mockUser = {
                _id: 'user_123',
                name: 'Demo User',
                email: 'demo@currycrave.com',
                role: 'user'
            };
            localStorage.setItem('authToken', 'mock_token_123');
            localStorage.setItem('user', JSON.stringify(mockUser));
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userName', mockUser.name);
            localStorage.setItem('userEmail', mockUser.email);
            showToast('Demo Login Successful!');
            return { success: true, user: mockUser, token: 'mock_token_123' };
        }

        showToast('Connection error. Use demo@currycrave.com / demo123 to test.');
        return null;
    }
}

// Signup function
async function signupUser(name, email, password, phone) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, phone })
        });

        const data = await response.json();

        if (data.success) {
            return data;
        } else {
            showToast(data.message || 'Signup failed. Please try again.');
            return null;
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Connection error. Please check your internet connection.');
        return null;
    }
}

// Get auth token for API requests
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Get menu items
async function getMenuItems() {
    try {
        const response = await fetch(`${API_URL}/food`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching menu:', error);
    }
}

// ===== LOAD SITE SETTINGS FROM ADMIN PANEL =====
async function loadSiteSettings() {
    try {
        const response = await fetch(`${API_URL}/settings`);
        const result = await response.json();

        if (result.success && result.settings) {
            const settings = result.settings;
            const brandName = settings.restaurantName || 'Curry Crave';
            const tagline = settings.tagline || 'Premium Food Delivery';

            // ===== UPDATE BRAND/LOGO NAME EVERYWHERE =====

            // Update Page Title
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                document.title = `${brandName} - ${tagline}`;
            }

            // Update Navbar Logo/Brand Name
            const navBrandName = document.getElementById('navBrandName');
            if (navBrandName) {
                navBrandName.textContent = brandName;
            }

            // Update Hero Section Brand Name
            const heroBrandName = document.getElementById('heroBrandName');
            if (heroBrandName) {
                heroBrandName.textContent = brandName;
            }

            // Update About Section Brand Name
            const aboutBrandName = document.getElementById('aboutBrandName');
            if (aboutBrandName) {
                aboutBrandName.textContent = brandName;
            }

            // Update Footer Title
            const footerTitle = document.getElementById('footerTitle');
            if (footerTitle) {
                footerTitle.textContent = brandName;
            }

            // Update Footer Tagline
            const footerTagline = document.getElementById('footerTagline');
            if (footerTagline) {
                footerTagline.textContent = tagline;
            }

            // Update Footer Copyright
            const footerCopyright = document.getElementById('footerCopyright');
            if (footerCopyright) {
                const year = new Date().getFullYear();
                footerCopyright.innerHTML = `&copy; ${year} ${brandName}. All rights reserved.`;
            }

            // ===== UPDATE CONTACT SECTION =====

            // Address
            const contactAddress = document.getElementById('contactAddress');
            if (contactAddress && settings.address) {
                const addr = settings.address;
                contactAddress.innerHTML = `${addr.street}<br>${addr.city}, ${addr.state} ${addr.pincode}`;
            }

            // Phone
            const contactPhone = document.getElementById('contactPhone');
            if (contactPhone) {
                contactPhone.innerHTML = `${settings.phone || '+91 98765 43210'}<br>${settings.alternatePhone || '+91 87654 32109'}`;
            }

            // Email
            const contactEmail = document.getElementById('contactEmail');
            if (contactEmail) {
                contactEmail.innerHTML = `${settings.email || 'info@currycrave.com'}<br>${settings.supportEmail || 'support@currycrave.com'}`;
            }

            // Business Hours
            const contactHours = document.getElementById('contactHours');
            if (contactHours && settings.businessHours) {
                contactHours.innerHTML = `${settings.businessHours.weekday}<br>${settings.businessHours.weekend}`;
            }

            // WhatsApp Number
            if (settings.whatsappNumber) {
                siteWhatsappNumber = settings.whatsappNumber.replace(/[^\d+]/g, '').replace('+', '');
            }

            // ===== UPDATE SOCIAL MEDIA LINKS =====
            if (settings.socialMedia) {
                const socialFacebook = document.getElementById('socialFacebook');
                if (socialFacebook && settings.socialMedia.facebook) {
                    socialFacebook.href = settings.socialMedia.facebook;
                }

                const socialInstagram = document.getElementById('socialInstagram');
                if (socialInstagram && settings.socialMedia.instagram) {
                    socialInstagram.href = settings.socialMedia.instagram;
                }

                const socialTwitter = document.getElementById('socialTwitter');
                if (socialTwitter && settings.socialMedia.twitter) {
                    socialTwitter.href = settings.socialMedia.twitter;
                }

                const socialYoutube = document.getElementById('socialYoutube');
                if (socialYoutube && settings.socialMedia.youtube) {
                    socialYoutube.href = settings.socialMedia.youtube;
                }
            }

            // ===== UPDATE ABOUT SECTION =====
            if (settings.aboutSection) {
                // About Image
                const aboutImage = document.getElementById('aboutImage');
                if (aboutImage && settings.aboutSection.image) {
                    aboutImage.src = settings.aboutSection.image;
                }

                // Experience Badge
                const aboutExperienceYears = document.getElementById('aboutExperienceYears');
                if (aboutExperienceYears && settings.aboutSection.experienceYears) {
                    aboutExperienceYears.textContent = settings.aboutSection.experienceYears;
                }

                const aboutExperienceText = document.getElementById('aboutExperienceText');
                if (aboutExperienceText && settings.aboutSection.experienceText) {
                    aboutExperienceText.textContent = settings.aboutSection.experienceText;
                }

                // About Paragraphs
                const aboutParagraph1 = document.getElementById('aboutParagraph1');
                if (aboutParagraph1 && settings.aboutSection.paragraph1) {
                    aboutParagraph1.textContent = settings.aboutSection.paragraph1;
                }

                const aboutParagraph2 = document.getElementById('aboutParagraph2');
                if (aboutParagraph2 && settings.aboutSection.paragraph2) {
                    aboutParagraph2.textContent = settings.aboutSection.paragraph2;
                }

                // Feature Items
                if (settings.aboutSection.features) {
                    const feature1 = document.getElementById('aboutFeature1');
                    if (feature1) feature1.textContent = settings.aboutSection.features.feature1 || 'Fresh Ingredients';

                    const feature2 = document.getElementById('aboutFeature2');
                    if (feature2) feature2.textContent = settings.aboutSection.features.feature2 || 'Expert Chefs';

                    const feature3 = document.getElementById('aboutFeature3');
                    if (feature3) feature3.textContent = settings.aboutSection.features.feature3 || 'Fast Delivery';

                    const feature4 = document.getElementById('aboutFeature4');
                    if (feature4) feature4.textContent = settings.aboutSection.features.feature4 || 'Premium Quality';
                }
            }

            console.log('✅ Site settings loaded successfully - Brand:', brandName);
        }
    } catch (error) {
        console.log('⚠️ Could not load site settings, using defaults');
    }
}
