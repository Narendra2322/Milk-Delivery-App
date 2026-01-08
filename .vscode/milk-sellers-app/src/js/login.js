// This file contains the logic for the login page, including form validation and authentication.

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (validateForm(username, password)) {
            authenticateUser(username, password);
        }
    });

    function validateForm(username, password) {
        if (!username || !password) {
            errorMessage.textContent = 'Please enter both username and password.';
            return false;
        }
        errorMessage.textContent = '';
        return true;
    }

    function authenticateUser(username, password) {
        fetch('../data/users.json')
            .then(response => response.json())
            .then(users => {
                const user = users.find(u => u.username === username && u.password === password);
                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = 'dashboard.html';
                } else {
                    errorMessage.textContent = 'Invalid username or password.';
                }
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                errorMessage.textContent = 'An error occurred. Please try again later.';
            });
    }
});