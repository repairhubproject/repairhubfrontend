import { register } from "../api/auth.js";

console.log("register.js loaded");

const form = document.getElementById("registerForm");
const button = document.getElementById("submit");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    button.disabled = true;

    button.textContent = "Please wait..."

    const user = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value,
    };

    try {
        console.log()
        const res = await register(user);

        alert("Registration Successful!");

        window.location.href = "/pages/auth/login.html";

    } catch (error) {

        alert(error.message);

        button.disabled = true;

        button.textContent = "Register"

    }

});