
import { getProtectedRequest } from "./api";

export async function getTechnicians(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category) {
      params.append("category", filters.category);
  }

  if (filters.lat && filters.lng) {
      params.append("lat", filters.lat);
      params.append("lng", filters.lng);
  }

  if (filters.search) {
      params.append("search", filters.search);
  }

  const endpoint = `/technicians?${params.toString()}`;


  const data = await getProtectedRequest(endpoint);

  return data.technicians;
}

export async function getTechnicianById(id) {
    
  return await getProtectedRequest(`/technicians/${id}`);
}