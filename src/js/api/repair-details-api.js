
import { getProtectedRequest } from "./api.js";
import {patchRequest} from "./api.js";


export async function getRepairRequest(id) {

  const data = await getProtectedRequest(
    `/requests/${id}`
  );

  return data.request;
}



export async function getRequestQuotations(id) {

  const data = await getProtectedRequest(
    `/requests/${id}/quotations`
  );

  return data.quotations;
}


export async function cancelRepairRequest(
  requestId
) {
  const data =
    await patchRequest(
      `/requests/${requestId}/cancel`
    );

  return data.request;
}

export async function acceptQuotation(
  quotationId,
  scheduledAt = null
) {
  const data = scheduledAt
    ? {
        scheduled_at: scheduledAt,
      }
    : null;

  const response = await patchRequest(
    `/quotations/${quotationId}/accept`,
    data
  );

  return response.booking;
}