import axios from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_URL || 'https://repairhubbackend.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Expired/invalid token → force re-login (but never on the auth calls themselves,
    // where a 401 just means "wrong password" and must reach the form).
    if (
      err.response?.status === 401 &&
      localStorage.getItem('rh_token') &&
      !err.config?.url?.startsWith('/auth/')
    ) {
      localStorage.removeItem('rh_token');
      localStorage.removeItem('rh_user');
      window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);

/** Human-readable message from an axios error. The API always uses { error }. */
export function errMsg(err, fallback = 'Something went wrong') {
  return err?.response?.data?.error || err?.message || fallback;
}

export default api;
