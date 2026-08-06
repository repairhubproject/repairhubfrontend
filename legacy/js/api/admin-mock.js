// src/js/api/admin-mock.js
//
// Single source of dummy data for admin sections that have no backend
// endpoint yet. Nothing here should be duplicated elsewhere — when a
// real endpoint ships for one of these sections, replace the export
// below with a real call into admin.js and update the page that uses
// it; nothing else needs to change.
//
// bookingId on repair/ledger rows maps to the real GET /bookings/:id
// endpoint (which does exist) — only booking #1 is real seed data on
// the live backend, the rest are illustrative ids that will 404 until
// more bookings exist.

export const MOCK_REPAIRS = {
    disputes: [
        { ref: "RH-JOB-7721", bookingId: 1, customer: "Chinedu Okafor", technician: "Tunde Electronics Ltd", device: "iPhone 13 Pro Max", cost: "₦120,000", status: "Active Dispute", reason: "Customer claims replacement screen is counterfeit.", action: "Arbitrate" },
        { ref: "RH-JOB-6540", bookingId: 2, customer: "Amara Nwosu", technician: "FixIt Gadgets", device: "Samsung Galaxy S22 Ultra", cost: "₦45,000", status: "Resolved", reason: "Escrow released to tech after customer confirmed delivery.", action: "View Details" },
        { ref: "RH-JOB-8812", bookingId: 3, customer: "Babajide Alao", technician: "Seyi Tech Hub", device: 'MacBook Pro 16" (M1)', cost: "₦280,000", status: "Active Dispute", reason: "Technician failed to deliver device in Lagos after 5 days.", action: "Arbitrate" },
        { ref: "RH-JOB-5412", bookingId: 4, customer: "Chioma Nze", technician: "Kano Tech Services", device: "HP Pavilion Laptop", cost: "₦35,000", status: "Resolved", reason: "Refunded 100% to customer due to technician damage.", action: "View Details" },
    ],
    active: [
        { ref: "RH-JOB-9013", bookingId: 5, customer: "Ifeoma Bello", technician: "Lagos Gadget Care", device: "iPad Air 5", cost: "₦65,000", status: "In Progress", reason: "Awaiting replacement part delivery.", action: "View Details" },
        { ref: "RH-JOB-9040", bookingId: 6, customer: "Musa Danladi", technician: "Kano Tech Services", device: "Samsung A54", cost: "₦22,000", status: "In Progress", reason: "Technician dispatched, ETA 2 hours.", action: "View Details" },
        { ref: "RH-JOB-9051", bookingId: 7, customer: "Grace Effiong", technician: "PH Repair Hub", device: "Dell XPS 13", cost: "₦58,000", status: "Delivered", reason: "Awaiting customer confirmation to release escrow.", action: "View Details" },
    ],
    history: [
        { ref: "RH-JOB-8890", bookingId: 8, customer: "Tunde Bakare", technician: "FixIt Gadgets", device: "iPhone 12", cost: "₦38,000", status: "Resolved", reason: "Repair completed and escrow released.", action: "View Details" },
        { ref: "RH-JOB-8877", bookingId: 9, customer: "Blessing Uche", technician: "Seyi Tech Hub", device: "HP Envy 13", cost: "₦41,500", status: "Resolved", reason: "Repair completed and escrow released.", action: "View Details" },
    ],
};

export const MOCK_REPAIRS_SUMMARY = {
    active: "Showing 1 to 3 of 318 active repairs",
    history: "Showing 1 to 2 of 246 completed repairs",
    disputes: "Showing 1 to 4 of 12 active disputes",
};

export const MOCK_LEDGER = [
    { tx: "TX-90218", job: "RH-JOB-7721", bookingId: 1, provider: "Tunde Electronics Ltd", gross: "₦120,000", commission: "₦18,000", net: "₦102,000", status: "Pending Dispute Review", action: "Audit" },
    { tx: "TX-88402", job: "RH-JOB-6540", bookingId: 2, provider: "FixIt Gadgets", gross: "₦45,000", commission: "₦6,750", net: "₦38,250", status: "Cleared for Release", action: "Release Pay" },
    { tx: "TX-87910", job: "RH-JOB-8812", bookingId: 3, provider: "—", gross: "₦280,000", commission: "₦42,000", net: "₦238,000", status: "Escrow Locked", action: "Audit" },
    { tx: "TX-86532", job: "RH-JOB-5412", bookingId: 4, provider: "Kano Tech Services", gross: "₦35,000", commission: "₦5,250", net: "₦29,750", status: "Cleared for Release", action: "Release Pay" },
];

export const MOCK_REGIONAL_PERFORMANCE = [
    { name: "Lagos (Ikeja/Lekki)", share: 45, value: "₦19.2M" },
    { name: "Abuja (Wuse II)", share: 25, value: "₦10.7M" },
    { name: "Rivers (Port Harcourt)", share: 15, value: "₦6.4M" },
    { name: "Ibadan (Bodija)", share: 10, value: "₦4.2M" },
    { name: "Enugu (Independence Layout)", share: 5, value: "₦2.1M" },
];

export const MOCK_TECHNICIAN_PERFORMANCE = [
    { name: "Mobile Device Specialists", active: "842 Techs", time: "3.2 Hours", rating: "4.82 ★", dispute: "1.2%", disputeColor: "text-emerald-600", payouts: "₦18,420,000", health: "Excellent", healthColor: "bg-emerald-100 text-emerald-700" },
    { name: "Computing & Laptops", active: "512 Techs", time: "6.8 Hours", rating: "4.58 ★", dispute: "3.4%", disputeColor: "text-amber-600", payouts: "₦12,110,000", health: "Optimal", healthColor: "bg-blue-100 text-blue-700" },
    { name: "Smart Home & TVs", active: "288 Techs", time: "12.4 Hours", rating: "4.12 ★", dispute: "5.8%", disputeColor: "text-red-600", payouts: "₦6,410,200", health: "Needs Review", healthColor: "bg-amber-100 text-amber-700" },
];

export const MOCK_PERMISSIONS_MATRIX = [
    { scope: "Edit System Fee Settings", superAdmin: true, operations: false, support: false },
    { scope: "Trigger Escrow Releases", superAdmin: true, operations: true, support: false },
    { scope: "Arbitrate Disputes", superAdmin: true, operations: true, support: true },
];

export const MOCK_API_KEYS = [
    { label: "Providus Bank Payout Node (Live)", value: "sk_live_providus_902183120938102" },
    { label: "Monnify Escrow Gateway (Live)", value: "sk_live_monnify_884021029381203" },
    { label: "Google Maps API (Dispatch Routing)", value: "ai_za_sy_google_maps_772109381" },
];
