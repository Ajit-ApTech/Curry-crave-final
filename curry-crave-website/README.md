# 🍛 Curry Crave - Premium Food Delivery Website

A premium, modern food delivery website built for hostel residents with a beautiful UI featuring authentic Indian cuisine.

## 🎨 Features

- **Premium Design**: Modern dark theme with gold accents
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Interactive Menu**: Category filtering and search functionality
- **Shopping Cart**: Full cart management with localStorage persistence
- **User Authentication**: Login/logout system with localStorage
- **Smooth Animations**: Scroll effects and micro-interactions
- **Contact System**: Contact form and WhatsApp integration
- **Video Modal**: Embedded video player for promotional content

## 📁 Project Structure

```
curry-crave-website/
├── assets/
│   └── images/          # All food and UI images
├── css/
│   └── styles.css       # Complete styling (1,868 lines)
├── js/
│   ├── main.js          # Main functionality (581 lines)
│   └── cart.js          # Cart management (249 lines)
└── index.html           # Main HTML file (530 lines)
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional but recommended)

### Installation

1. **Clone or download** this project to your local machine

2. **Open the website**:
   
   **Option A: Direct File Opening** (Basic)
   - Simply open `index.html` in your web browser
   - Note: Some features may not work due to CORS policies

   **Option B: Using Python** (Recommended)
   ```bash
   # Navigate to the project directory
   cd "/Users/ajitprajapati/Documents/don't know copy/curry-crave-website"
   
   # Python 3
   python3 -m http.server 8000
   
   # Then open: http://localhost:8000
   ```

   **Option C: Using PHP**
   ```bash
   php -S localhost:8000
   ```

   **Option D: Using VS Code Live Server**
   - Install "Live Server" extension in VS Code
   - Right-click on `index.html` → "Open with Live Server"

## 🎯 Usage

### Navigation
- Use the top navigation bar to jump to different sections
- Mobile users: Click the hamburger menu icon

### Menu Browsing
- Browse all items in the "Our Menu" section
- Filter by category: All, Curry, Bread, Rice, Drinks, Desserts
- Use the search bar in the hero section to find specific dishes

### Shopping Cart
- Click "+ Add" button on any menu item to add to cart
- Click the cart icon in the navigation to view your cart
- Adjust quantities with +/- buttons
- Remove items individually
- Proceed to checkout when ready

### User Account
- Click "Login" button in navigation
- Enter credentials (demo mode - any email works)
- Toggle "Remember me" to persist login
- Click "Logout" when done

### Contact
- Fill out the contact form in the Contact section
- Or click "Chat on WhatsApp" for direct messaging

## 🛠️ Technical Details

### Technologies Used
- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Flexbox, Grid, Animations
- **JavaScript (Vanilla)**: ES6+, LocalStorage API, Fetch API
- **Font Awesome**: Icon library
- **Google Fonts**: Playfair Display & Poppins

### Color Scheme
- **Primary**: Gold (#D4AF37)
- **Background**: Rich Black (#0D0D0D)
- **Accent**: Fresh Green (#2ECC71), Vibrant Orange (#FF6B35)
- **Text**: Cream (#F5F5DC)

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📱 Backend Integration

This frontend is designed to work with the Curry Crave Backend API located in:
```
../Backend/curry-crave-backend/
```

### Backend Setup (Optional)

The backend requires Node.js and MongoDB. To set it up:

1. **Install Node.js**:
   - Download from: https://nodejs.org/
   - Install the LTS version

2. **Install dependencies**:
   ```bash
   cd "../Backend/curry-crave-backend"
   npm install
   ```

3. **Configure environment**:
   - Check `.env` file for database and API settings
   - Update MongoDB connection string if needed

4. **Start the backend**:
   ```bash
   npm run dev
   ```
   Server will run at: `http://localhost:5000`

5. **Note**: The frontend is currently configured to use hardcoded menu data and localStorage. Backend integration is optional for full features.

## 🎨 Customization

### Changing Colors
Edit CSS variables in `css/styles.css` (lines 1-52):
```css
:root {
    --primary-gold: #D4AF37;
    --vibrant-green: #2ECC71;
    /* ... modify as needed ... */
}
```

### Adding Menu Items
Edit `menuItems` array in `js/main.js` (line 263):
```javascript
{
    id: 13,
    name: 'Your Dish Name',
    description: 'Description here',
    price: 299,
    category: 'curry',
    image: 'assets/images/your-image.jpg',
    rating: 4.8,
    badge: 'New'
}
```

### Updating Images
- Replace images in `assets/images/` folder
- Maintain the same filenames or update references in HTML/JS
- Recommended image size: 400x400px for menu items

## 📝 Recent Fixes (Dec 12, 2025)

✅ **Fixed Issues:**
1. Generated all 17 missing food images
2. Removed old backup file (`mainold.js`)
3. Organized image assets properly
4. Added comprehensive documentation

## 🐛 Known Limitations

- Backend integration requires Node.js installation
- Some features work best with a local server (not direct file opening)
- WhatsApp button uses placeholder phone number (update in `js/main.js` line 495)

## 📧 Support

For issues or questions:
- Email: support@currycrave.com
- WhatsApp: Update number in code

## 📄 License

This project is created for educational purposes.

## 🙏 Credits

- Design & Development: Curry Crave Team
- Images: AI-Generated food photography
- Icons: Font Awesome
- Fonts: Google Fonts

---

**🚀 Enjoy using Curry Crave!**
