
import { getProtectedRequest } from "./api.js";

export async function getLocationFromCoordinates(lat, lng) {

  const endpoint = `/geo/reverse?lat=${lat}&lng=${lng}`;

  const data = await getProtectedRequest(endpoint);

  return data;
}