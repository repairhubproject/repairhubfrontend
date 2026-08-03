import { login } from "../api/auth.js";

console.log('log in page')

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

        const data = await login(credentials);

        alert("Login Successful");

        const dashboardByRole = {
            admin: "/pages/admin/dashboard.html",
            technician: "/pages/technician/dashboard.html",
            customer: "/pages/customer/dashboard.html",
        };

        window.location.href = dashboardByRole[data.user?.role] || "/pages/customer/dashboard.html";

    } catch (error) {

        alert(error.message);

    } finally {
      button.disabled = false;
      button.textContent = "Login";
    }

});