const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api").replace(/\/$/, "");
const TOKEN_KEY = "laundry_access_token";

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

function saveSession(data) {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  return data.user;
}

export const authClient = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }).then(saveSession),
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }).then(saveSession),
  me: () => request("/auth/me").then(({ user }) => user),
  updateMe: (payload) => request("/auth/me", { method: "PUT", body: JSON.stringify(payload) }).then(({ user }) => user),
  requestPasswordReset: (email) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (email, otp, newPassword) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, otp, newPassword }) }),
  logout: () => localStorage.removeItem(TOKEN_KEY),
  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY)),
};

export const laundryClient = {
  getServices: () => request("/services").then(({ services }) => services),
  createBooking: (payload) => request("/bookings", { method: "POST", body: JSON.stringify(payload) }).then(({ booking }) => booking),
  getBookings: () => request("/bookings").then(({ bookings }) => bookings),
  getBooking: (id) => request(`/bookings/${id}`).then(({ booking }) => booking),
};
