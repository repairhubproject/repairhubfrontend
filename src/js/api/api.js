// src/js/api/api.js

export const API_URL = "https://repairhubbackend.onrender.com/api";

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const config = {
        headers: {
            "Content-Type": "application/json",
            ...(token && {
                Authorization: `Bearer ${token}`,
            }),
        },
        ...options,
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || "Something went wrong");
    }

    return data;
}