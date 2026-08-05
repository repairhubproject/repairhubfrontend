
import { getProtectedRequest } from "./api.js";

export async function getNearbyTechnicians(lat, lng) {

  const endpoint = `/technicians?lat=${lat}&lng=${lng}`;

  const data = await getProtectedRequest(endpoint);

  return data;
}

export async function getTechnicianById(id) {
  return await getProtectedRequest(`/technicians/${id}`);
}