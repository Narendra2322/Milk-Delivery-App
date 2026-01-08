# Milk Sellers App

## Overview
The Milk Sellers App is a web application that allows users to register, log in, and view profiles of milk sellers. Users can explore seller details and contact them directly through the application.

## Project Structure
```
milk-sellers-app
├── src
│   ├── index.html          # Main entry point of the application
│   ├── register.html       # Registration form for new users
│   ├── login.html          # Login form for existing users
│   ├── dashboard.html      # Dashboard displaying seller profiles
│   ├── components
│   │   ├── header.html     # Header component for navigation
│   │   └── seller-card.html # Structure for seller cards
│   ├── css
│   │   └── styles.css      # Styles for the application
│   └── js
│       ├── main.js         # Main JavaScript file
│       ├── auth.js         # Authentication functions
│       ├── register.js      # Logic for registration
│       ├── login.js        # Logic for login
│       ├── dashboard.js     # Logic for the dashboard
│       └── modal.js        # Modal functionality for seller details
├── data
│   └── users.json          # User data in JSON format
├── package.json             # npm configuration file
├── .gitignore               # Git ignore file
└── README.md                # Project documentation
```

## Features
- **User Registration**: New users can sign up through the registration page.
- **User Login**: Existing users can log in to access the dashboard.
- **Dashboard**: Displays a list of milk sellers with options to view detailed profiles.
- **Responsive Design**: The application is designed to be mobile-friendly.

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd milk-sellers-app
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Open `src/index.html` in a web browser to view the application.

## Usage
- Navigate to the registration page to create a new account.
- Use the login page to access your account.
- Once logged in, you can view the dashboard and explore seller profiles.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License.