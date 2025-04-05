// Getting elements
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const togglePassword = document.getElementById('togglePassword');

// Updated authentication credentials
const validEmail = 'vaibhav22gandhi@gmail.com';
const validPassword = 'vaibhav';

authForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate email format
    if (!validateEmail(email)) {
        errorMessage.textContent = 'Please enter a valid email address.';
        return;
    }

    // Authentication check
    if (email === validEmail && password === validPassword) {
        alert('🎉 Login Successful!');
        errorMessage.textContent = ''; // Clear error message
        authForm.reset(); // Reset form fields

        // Redirect to upload page
        window.location.href = 'upload.html';
    } else {
        errorMessage.textContent = '❌ Invalid email or password. Try again.';
    }
});

// Email validation function
function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Show/Hide password toggle
togglePassword.addEventListener('change', function () {
    passwordInput.type = this.checked ? 'text' : 'password';
});
