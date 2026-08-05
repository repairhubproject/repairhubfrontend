
import { postRequest } from "./api.js";

export async function createRepairRequest(formData) {
  const data = await postRequest(
    "/requests",
    formData
  );

  return data;
}