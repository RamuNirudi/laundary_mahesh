// Authentication and customer-facing endpoints.

import { api, clearToken, getToken, setToken } from "./client";

const saveSession = (data) => {
  setToken(data.access_token);
  return data.user;
};

export const authClient = {
  signup: (payload) => api.post("/auth/signup", payload).then(saveSession),
  login: (email, password) => api.post("/auth/login", { email, password }).then(saveSession),
  me: () => api.get("/auth/me").then(({ user }) => user),
  updateMe: (payload) => api.put("/auth/me", payload).then(({ user }) => user),
  changePassword: (currentPassword, newPassword) =>
    api.put("/auth/password", { currentPassword, newPassword }),
  requestPasswordReset: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (email, otp, newPassword) =>
    api.post("/auth/reset-password", { email, otp, newPassword }),
  logout: () => clearToken(),
  isAuthenticated: () => Boolean(getToken()),
};

export const laundryClient = {
  getServices: () => api.get("/services").then(({ services }) => services),
  getSettings: () => api.get("/settings").then(({ settings }) => settings),
  createBooking: (payload) => api.post("/bookings", payload).then(({ booking }) => booking),
  getBookings: () => api.get("/bookings").then(({ bookings }) => bookings),
  getBooking: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id) => api.post(`/bookings/${id}/cancel`).then(({ booking }) => booking),
  /** Checks a coupon against the current subtotal and returns { coupon, discount }. */
  validateCoupon: (code, subtotal) => api.post("/coupons/validate", { code, subtotal }),
  sendContactMessage: (payload) => api.post("/contact", payload),
};
