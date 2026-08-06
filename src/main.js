/**
 * Entry point — the route table plus shell selection that App.jsx and main.jsx
 * used to hold between them.
 */
import './index.css';

import { route, setNotFound, setShellResolver, startRouter } from './lib/router.js';
import { getAuth, initAuth } from './state/auth.js';
import { initNotifications } from './state/notifications.js';
import { mountAppShell, mountGuestShell } from './components/layout.js';
import { toHTML } from './lib/dom.js';
import { Spinner } from './components/ui.js';

import Landing from './pages/landing.js';
import Login from './pages/login.js';
import Register from './pages/register.js';
import TechnicianSearch from './pages/technician-search.js';
import TechnicianDetail from './pages/technician-detail.js';
import Dashboard from './pages/dashboard.js';
import Notifications from './pages/notifications.js';
import BookingsList from './pages/bookings-list.js';
import BookingDetail from './pages/booking-detail.js';
import Wallet from './pages/wallet.js';
import Profile from './pages/profile.js';
import NotFound from './pages/not-found.js';

import BrowseCategories from './pages/customer/browse-categories.js';
import SearchRepairs from './pages/customer/search-repairs.js';
import NewRequest from './pages/customer/new-request.js';
import MyRequests from './pages/customer/my-requests.js';
import RequestDetail from './pages/customer/request-detail.js';
import Warranties from './pages/customer/warranties.js';

import TechProfileForm from './pages/technician/tech-profile-form.js';
import AvailableRequests from './pages/technician/available-requests.js';
import JobDetails from './pages/technician/job-details.js';

import VerifyTechnicians from './pages/admin/verify-technicians.js';
import Users from './pages/admin/users.js';
import Categories from './pages/admin/categories.js';

/* ------------------------------- Guards ---------------------------------- */

/**
 * Route guard — the <Protected> element. Returns a path to redirect to, or
 * nothing to let the page render. Optionally restricted to specific roles.
 */
function protect(roles) {
  return (ctx) => {
    const { user, token } = getAuth();
    if (!token || !user) return `/login?from=${encodeURIComponent(ctx.path)}`;
    if (roles && !roles.includes(user.role)) return '/dashboard';
  };
}

/** Signed-in users have no business on the login/register forms. */
function guestOnly() {
  return () => (getAuth().user ? '/dashboard' : undefined);
}

/* ------------------------------- Routes ----------------------------------- */

// Public
route('/', Landing);
route('/login', Login, { guard: guestOnly() });
route('/register', Register, { guard: guestOnly() });
route('/technicians', TechnicianSearch);
route('/technicians/:id', TechnicianDetail);

// Any logged-in user
route('/dashboard', Dashboard, { guard: protect() });
route('/notifications', Notifications, { guard: protect() });
route('/bookings', BookingsList, { guard: protect() });
route('/bookings/:id', BookingDetail, { guard: protect() });
route('/wallet', Wallet, { guard: protect() });
route('/profile', Profile, { guard: protect() });
route('/categories', BrowseCategories, { guard: protect() });

// Customer
route('/search', SearchRepairs, { guard: protect(['customer']) });
route('/requests', MyRequests, { guard: protect(['customer']) });
route('/requests/new', NewRequest, { guard: protect(['customer']) });
route('/requests/:id', RequestDetail, { guard: protect(['customer']) });
route('/warranties', Warranties, { guard: protect(['customer']) });

// Technician
route('/tech/profile', TechProfileForm, { guard: protect(['technician']) });
route('/tech/requests', AvailableRequests, { guard: protect(['technician']) });
route('/tech/requests/:id', JobDetails, { guard: protect(['technician']) });

// Admin
route('/admin/technicians', VerifyTechnicians, { guard: protect(['admin']) });
route('/admin/users', Users, { guard: protect(['admin']) });
route('/admin/categories', Categories, { guard: protect(['admin']) });

setNotFound(NotFound);

/* -------------------------------- Shell ----------------------------------- */

let appShell = null;

setShellResolver(() => {
  const { user, token } = getAuth();

  if (token && user) {
    return {
      key: `app:${user.role}:${user.id}`,
      mount(mountPoint) {
        appShell = mountAppShell(mountPoint, user);
        return appShell.outlet;
      },
      onNavigate: (ctx) => appShell?.onNavigate(ctx),
      destroy: () => appShell?.destroy(),
    };
  }

  appShell = null;
  return {
    key: 'guest',
    mount: (root) => mountGuestShell(root),
  };
});

/* --------------------------------- Boot ----------------------------------- */

const root = document.getElementById('root');

// Re-validate a stored token before the first render, so a revoked session
// never briefly shows an app shell it cannot fetch data for. The old
// <Protected> spinner covers the wait.
if (getAuth().loading) root.innerHTML = toHTML(Spinner('Checking session…'));

initNotifications();

initAuth().finally(() => startRouter(root));
