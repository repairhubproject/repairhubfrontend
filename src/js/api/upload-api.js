// upload-api.js

import { postRequest } from "./api.js";

export async function getUploadSignature() {
  const data = await postRequest(
    "/uploads/signature",
    {}
  );

  return data;
}