const nairaFmt = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

/** The API returns numerics as strings ("35000.00") — parse before formatting. */
export function naira(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return nairaFmt.format(n);
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

/** Classes per lifecycle status — requests, quotations, bookings, payments. */
export const STATUS_STYLES = {
  open: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  booked: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  scheduled: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  withdrawn: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  refunded: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

export function statusLabel(status) {
  return (status || '').replace(/_/g, ' ');
}

export function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
