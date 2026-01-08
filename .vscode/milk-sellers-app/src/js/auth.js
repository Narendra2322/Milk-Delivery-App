// src/js/auth.js

const registerUser = (userData) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
};

const loginUser = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.find(user => user.email === email && user.password === password);
};

const isAuthenticated = () => {
    return localStorage.getItem('currentUser') !== null;
};

const setCurrentUser = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
};

const logoutUser = () => {
    localStorage.removeItem('currentUser');
};

export { registerUser, loginUser, isAuthenticated, setCurrentUser, logoutUser };