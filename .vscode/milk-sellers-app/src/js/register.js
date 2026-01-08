// This file contains the logic for the registration page, including form validation and submission.

document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const users = JSON.parse(localStorage.getItem('users')) || [];

    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fname = document.getElementById('fname').value.trim();
        const lname = document.getElementById('lname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const milkType = document.querySelector('input[name="milkType"]:checked')?.value;

        if (!fname || !lname || !email || !password || !milkType) {
            alert('Please fill in all fields.');
            return;
        }

        if (users.some(user => user.email === email)) {
            alert('Email is already registered.');
            return;
        }

        const newUser = {
            fname,
            lname,
            email,
            password,
            milkType,
            role: 'seller',
            photo: '', // Placeholder for user photo
            milkCost: 0 // Placeholder for milk cost
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        alert('Registration successful! You can now log in.');
        window.location.href = 'login.html';
    });
});