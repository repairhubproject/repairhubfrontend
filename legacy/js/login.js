
import { login } from "./api/auth.js";

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const credentials = {

        email: document.getElementById("email").value,

        password: document.getElementById("password").value,

    };

    try {

        await login(credentials);

        alert("Login Successful");

        window.location.href = "/dashboard.html";

    } catch (error) {

        alert(error.message);

    }

});