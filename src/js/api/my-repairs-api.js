import { getProtectedRequest } from "./api.js";

export async function getMyRepairRequests() {
  const data = await getProtectedRequest(
    "/requests/mine"
  );

  return data.requests;
}