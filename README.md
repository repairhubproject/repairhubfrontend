# RepairHub — Frontend

Trusted Repair Services Marketplace. TechCrush Capstone, Group 9.

React 18 + Vite + Tailwind v4 SPA, wired to the live API at
**https://repairhubbackend.onrender.com** (endpoint reference is served at the API root).

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview
```

`.env` holds `VITE_API_URL` (the API origin — the client appends `/api` itself).
See `.env.example` for the optional Firebase web-push variables; leave them
blank and push registration is skipped silently, while in-app realtime
notifications keep working over Socket.IO.

## Structure

```
src/
  api/client.js          axios instance — injects the JWT, bounces to /login on a 401
  context/
    AuthContext.jsx      session: login, register, logout, boot-time /auth/me revalidation
    NotificationContext.jsx  notification list + Socket.IO live feed + unread count
  components/
    Layout.jsx           two shells: marketing header for guests, topbar+sidebar for members
    Protected.jsx        route guard, optionally role-restricted
    ui.jsx               Spinner, EmptyState, StatusBadge, RatingStars, Modal, PageHeader, Avatar
    PhotoUploader.jsx    signed direct-to-Cloudinary upload, with paste-a-URL fallback
  lib/
    format.js            naira/date formatting, status colour map
    push.js              FCM device registration (no-op when unconfigured)
  pages/                 one file per screen, grouped by role
```

Role-based routing lives in `src/App.jsx`; the sidebar links per role are in
`NAV_BY_ROLE` at the top of `src/components/Layout.jsx`.

## Design tokens

`src/index.css` holds the whole visual system in one place — the `@theme` block
(brand palette, fonts) plus the `@utility` definitions for `input`, `label`,
`btn-*`, and `card`. Retuning the app to the Figma board is a matter of editing
that file rather than touching pages.

## Designed screens with no API behind them

The Figma board specifies these; the backend has no endpoint to populate them,
so they are deliberately **not** in the app rather than shipped as dead links or
fake data. Each needs an endpoint before it can be built:

| Screen | Missing endpoint |
|---|---|
| Message / chat | No messaging API at all |
| Reviews (customer's own) | Only `POST /reviews/bookings/:id` exists — no "list my reviews" |
| Saved Addresses | No address CRUD |
| Payment Methods | None — Paystack is redirect-per-booking, no stored cards |
| Settings | No preferences endpoint |
| Help & support | Static content / no ticketing API |
| Admin: Live Regional Activity | No hub/region model |
| Admin: Flagged Transactions, System Alerts & Audits | No dispute or audit-log API |
| Admin: revenue trend chart | `/admin/analytics` returns totals only, no time series |

Partial gaps, where the screen is built but a designed field is dropped or
carried in a different column:

- **Repair Quote (technician)** — the board shows an itemised breakdown (screen,
  labour, VAT…). The API stores a quotation as one `amount` plus a free-text
  `message`, with no line-item model. The builder therefore sums the lines into
  `amount` and writes the breakdown into `message`, so the total is real and the
  customer still sees what they are paying for. Add a line-items table server-side
  to make this structured.
- **Received Quotation (customer)** — same gap from the other side: service
  charge, 7.5% tax and the validity date are not stored, so the summary shows the
  agreed total and whatever breakdown the technician typed.
- **Create Repair Request** — Brand and Model are dropdowns on the board but
  there is no device-catalogue endpoint, so they are free text and compose the
  required `title`. The serial number has no column and is appended to
  `description` rather than dropped.
- **Repair Tracking** — the board's six-step stepper includes "Pending Parts" and
  "Quality Check". The API's lifecycle is `scheduled → in_progress → completed`
  plus warranty and payment, which is what the stepper renders.
- **Repair Tracking details** — "Priority" and "Repair Center" have no fields.
- **Job Details (technician)** — the board's **"Accept Job"** implies a direct
  accept, but the marketplace does not work that way: a technician submits a
  quotation and the *customer* accepts it. Accept therefore opens the quote
  builder. This is a genuine flow mismatch worth resolving on the design side.
  **"Decline Request"** has no endpoint and only hides the request on that
  browser (`src/lib/dismissed.js`). The customer star-rating, price pill and
  estimated work time are omitted — customers are not rated by the API, an open
  request has no price yet, and there is no work-time field.
- **Repair Progress (technician)** — "Pending Parts / Waiting" and "Quality
  Check / Testing" are not statuses the API knows (`scheduled → in_progress →
  completed`). Confirming one appends a job update whose note is the stage name,
  so the customer sees it on their timeline and it survives reload, while the
  status stays `in_progress`. "Contact Customer" is omitted: a booking exposes
  `customer_name` only, with no phone, email or messaging endpoint.
- **Directory & Entity Management** — "Service Centers" is not a modelled entity;
  row delete and "Invite Partner" have no endpoints, so both are omitted. Location
  and account status come from the technician profile, so they are blank for
  customers. Export CSV is generated client-side from the loaded rows.

## legacy/

The original static HTML/CSS/vanilla-JS build of these screens. Kept as the
visual reference the React pages were derived from — not part of the build, and
safe to delete once the React app is signed off.

## Deployment (Render)

`render.yaml` declares the static site and, critically, a `/* → /index.html`
rewrite. Without it, refreshing on `/dashboard` (or any client route) 404s.
A service created through the dashboard rather than the Blueprint needs that
rewrite added manually under Redirects/Rewrites.
