// src/js/api/admin.js

import { apiRequest } from "./api.js";

export async function getUsers() {
    return await apiRequest("/admin/users");
}

export async function getTechnicians(status = "pending") {
    return await apiRequest(`/admin/technicians?status=${status}`);
}

export async function verifyTechnician(id, decision) {
    return await apiRequest(`/admin/technicians/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
    });
}

export async function getAnalytics() {
    return await apiRequest("/admin/analytics");
}

export async function getBooking(id) {
    return await apiRequest(`/bookings/${id}`);
}

export async function getRequest(id) {
    return await apiRequest(`/requests/${id}`);
}
