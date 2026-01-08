# Shift White Gold - Milk Seller Platform

## Project Overview
Shift White Gold is a comprehensive web application that connects milk sellers with customers. The platform enables milk sellers to register their profiles and receive orders, while customers can browse available sellers, add items to cart, and place orders with Cash on Delivery payment.

## Key Features

### For Milk Sellers
- **Registration**: Create detailed seller profile (name, contact, milk type, price, address, photo)
- **Dashboard**: View incoming orders and customer messages in real-time
- **Order Management**: Accept and manage customer orders
- **Public Profile**: Showcase your business to all potential customers

### For Customers (Clients)
- **Browse Sellers**: View all registered milk sellers with complete details
- **Smart Filtering**: Filter sellers by milk type (Cow/Buffalo)
- **Shopping Cart**: Add multiple sellers' products to cart before checkout
- **Order Placement**: Place orders with Cash on Delivery payment method
- **Quick Order**: Direct order from seller card or profile modal

### General Features
- **Secure Authentication**: JWT-based login/registration system with password hashing
- **Dual Mode Operation**: Works with backend server (online) or localStorage (offline fallback)
- **Responsive Design**: Optimized for desktop and mobile devices
- **Sample Data**: Pre-loaded demo sellers for quick testing
- **Welcome Animation**: Smooth intro animation on landing page

## File Structure
```
shift-white-gold/
├── index.html              # Main landing page showing all sellers
├── login.html              # User login page
├── register.html           # New user registration (seller/client)
├── dashboard.html          # Seller dashboard for managing orders
├── cart.html               # Shopping cart page
├── payment.html            # Payment and order confirmation
├── package.json            # Frontend dependencies (live-server)
├── README.md               # Project documentation (this file)
├── backend/                # Express.js backend server
│   ├── index.js            # Main server file with all API endpoints
│   ├── data.json           # JSON database file (users, orders, etc.)
│   ├── package.json        # Backend dependencies
│   ├── README.md           # Backend-specific documentation
│   ├── test_api.js         # API endpoint tests
│   ├── verify_flow.js      # End-to-end flow verification
│   └── e2e_test.js         # Additional integration tests
└── src/                    # Source folder (optional/legacy files)
    ├── css/                # Additional stylesheets
    ├── js/                 # Additional JavaScript files
    └── data/               # Additional data files
```

## Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Step 1: Install Backend Dependencies

```powershell
cd 'C:\Users\manda\OneDrive\Desktop\shift white gold\backend'
npm install
```

This installs:
- `express` - Web framework for Node.js
- `cors` - Cross-origin resource sharing
- `bcryptjs` - Password hashing for security
- `jsonwebtoken` - JWT token authentication
- `nodemon` - Auto-restart during development

### Step 2: Start Backend Server
 Guide

### Registering as a Milk Seller

1. Click **"Register as Seller"** button on the homepage
2. Fill in all required details:
   - First Name & Last Name
   - Mobile Number (format: +91xxxxxxxxxx)
   - Email Address
   - Password
   - Milk Type (Cow or Buffalo)
   - Price per Liter (₹)
   - Address
   - Photo URL (optional)
3. Click **"Create Seller Account"**
4. You'll be redirected to the login page
5. Login with your mobile number and password
6. Access your seller dashboard to manage orders

### Registering as a Customer

1. Click **"Register"** button for regular customer registration
2. Fill in basic details (name, mobile, email, password)
3. Create account and login
4. Browse sellers and place orders

### Placing an Order (Customer)

**Method 1: Quick Add from Card**
- Enter quantity in "Liters" field on any seller card
- Click **"Add to cart"** button

**Method 2: From Seller Profile**
- Click on any seller card to view full profile
- Enter desired liters
- Click **"Order"** for immediate purchase or **"Add to cart"** to continue shopping

**Method 3: Cart Checkout**
- Add items to cart from multiple sellers
- Click **"Cart"** button in header
- Review items and quantities
- Click **"Place Orders"**
- Confirm payment method (Cash on Delivery)
- Click **"Confirm Order"**

### Managing Orders (Seller Dashboard)

1. Login to your seller account
2. View incoming orders with customer details
3. Click **"Accept Order"** to confirm
4. Monitor all orders and messages

## API Endpoints

### Authentication
- `POST /api/register` - Register new user (seller or client)
- `POST /api/login` - Login and receive JWT token

### Public
- `GET /api/sellers` - Get all registered sellers

### Cart (Authentication Required)
- `GET /api/cart` - Get user's cart items
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart/:id` - Remove cart item

### Orders (Authentication Required)
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Place new order(s)
- `POST /api/orders/:id/accept` - Seller accepts order

### Messages (Authentication Required)
- `GET /api/messages` - Get seller's notifications

## Technologies Used

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Fetch API for HTTP requests
- LocalStorage for offline persistence

**Backend:**
- Node.js & Express.js
- bcryptjs for password hashing
- jsonwebtoken for JWT authentication
- JSON file as simple database

## Troubleshooting

**Backend won't start:**
- Check if port 4000 is in use: `netstat -ano | findstr :4000`
- Kill the process or change PORT in backend/index.js

**Login/Registration fails:**
- Verify backend is running
- Check browser console for errors
- Ensure data.json is writable

**Orders not showing:**
- Clear browser cache and localStorage
- Restart backend server
- Check data.json for valid JSON format

## Security Notes

⚠️ **For Production Use:**
- Change JWT_SECRET to a strong random value
- Use HTTPS for all connections
- Implement rate limiting
- Use a proper database (MongoDB, PostgreSQL)
- Add input validation and sanitization
- Implement CSRF protection

## License

MIT License - Free to use for learning or commercial purposes.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for
```powershell
npm run dev
```

### Step 3: Open Frontend

**Option A: Using Live Server (Recommended for Development)**
```powershell
# From the project root folder
cd 'C:\Users\manda\OneDrive\Desktop\shift white gold'
npm install
npm start
```
This will automatically open the app in your browser.

**Option B: Using Backend's Static Server**
- The backend also serves the frontend files
- After starting the backend, navigate to **http://localhost:4000** in your browser

**Option C: Direct Browser Access**
- Simply open `index.html` directly in your web browser
- Note: Some features may require the backend server to be running

## Usage
- **Register as a Seller**: Navigate to the registration page to create a new seller account.
- **Login**: Use the login page to access your account.
- **Browse Sellers**: View available milk sellers on the home page and filter by milk type.
- **View Seller Details**: Click on a seller's profile to see more information and place orders.
- **Manage Orders**: Access your dashboard to manage your orders and account details.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.