// Requests a technician has declined.
//
// The API has no "decline" endpoint — a technician either quotes or ignores a
// request — so declining is a local preference on this browser only. It is
// deliberately not presented as a server-side action anywhere in the UI.
const KEY = 'rh_dismissed_requests';

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function isDismissed(id) {
  return read().includes(Number(id));
}

export function dismiss(id) {
  const next = [...new Set([...read(), Number(id)])];
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function undismiss(id) {
  localStorage.setItem(KEY, JSON.stringify(read().filter((n) => n !== Number(id))));
}
