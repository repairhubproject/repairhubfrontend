import { login, getCurrentUser } from "../api/auth.js";
import {togglePassword} from "../utils/toggle-password.js"


const form = document.getElementById("loginForm");
const button = document.getElementById('login-button')

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    button.disabled = true;

    button.textContent = "logging in..."

    const credentials = {

        email: document.getElementById("email").value,

        password: document.getElementById("password").value,

    };

    try {

        await login(credentials);

        alert("Login Successful");

        const response = await getCurrentUser()

       if (response.user.role === "customer") {
            window.location.href = "/pages/customer/dashboard.html";
        }

        if (response.user.role === "technician") {
            window.location.href = "/pages/technician/dashboard.html";
        }

    } catch (error) {

        alert(error.message);

    } finally {
      button.disabled = false;
      button.textContent = "Login";
    }

});

const passwordInput = document.getElementById("password");
const togglePasswordButton = document.getElementById("toggle-password");
const eyeIcon = document.getElementById("eye-icon");

togglePasswordButton.addEventListener("click",() => {
    togglePassword(passwordInput, togglePasswordButton, eyeIcon)
});