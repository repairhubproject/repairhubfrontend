// src/js/api/auth.js

import { apiRequest } from "./api.js";

export async function register(userData) {
  return await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function login(credentials) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  console.log(data)

  // save JWT
  localStorage.setItem("token", data.token);

  // Save logged-in user
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

export async function getCurrentUser() {
  return await apiRequest("/auth/me");
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}
