// src/js/api/api.js

export const API_URL = "https://repairhubbackend.onrender.com/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const config = {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token && {
        Authorization: `Bearer ${token}`,
      }),

      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Something went wrong");
  }

  return data;
}

// get request

export async function getProtectedRequest(endpoint) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/auth/login.html";
    return;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/auth/login.html";
    throw new Error("Your session has expired. Please log in again.");
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`,
    );
  }

  return data;
}


// post

export async function postRequest(endpoint, data) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/auth/login.html";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Only add JSON headers when data is not FormData
  if (!(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: data instanceof FormData ? data : JSON.stringify(data),
  });

  if (response.status === 401) {
    localStorage.removeItem("token");

    window.location.href = "/auth/login.html";

    return;
  }

  const result = await response.json();

  console.log("Status:", response.status);
  console.log("Backend response:", result);

  if (!response.ok) {
    throw new Error(result.message || result.error || JSON.stringify(result));
  }

  return result;
}



// patch
export async function patchRequest(endpoint, data = null) {
  const token = localStorage.getItem("token");

  // Redirect if the user is not logged in
  if (!token) {
    window.location.href = "/auth/login.html";

    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Only add JSON headers if data exists
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "PATCH",
    headers,

    body: data ? JSON.stringify(data) : null,
  });

  // Token is invalid or expired
  if (response.status === 401) {
    localStorage.removeItem("token");

    window.location.href = "/auth/login.html";

    return;
  }

  const result = await response.json();

  // Handle backend errors
  if (!response.ok) {
    throw new Error(
      result.message || result.error || "Unable to update request.",
    );
  }

  return result;
}
