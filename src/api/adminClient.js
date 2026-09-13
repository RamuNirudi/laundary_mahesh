// Admin panel and service-boy endpoints.

import { api, downloadFile } from "./client";

export const adminClient = {
  // --- Dashboard and reporting ---------------------------------------------
  getDashboard: () => api.get("/admin/dashboard"),
  getReport: (from, to) => api.get("/admin/report", { from, to }),
  downloadReportExcel: (from, to) =>
    downloadFile("/admin/report/export", { from, to }, `report-${from}_to_${to}.xlsx`),

  // --- Bookings -------------------------------------------------------------
  getBookings: () => api.get("/admin/bookings").then(({ bookings }) => bookings),
  updateBooking: (id, payload) =>
    api.put(`/admin/bookings/${id}`, payload).then(({ booking }) => booking),

  // --- Services -------------------------------------------------------------
  getServices: () => api.get("/admin/services").then(({ services }) => services),
  createService: (payload) => api.post("/admin/services", payload).then(({ service }) => service),
  updateService: (id, payload) =>
    api.put(`/admin/services/${id}`, payload).then(({ service }) => service),
  deleteService: (id) => api.delete(`/admin/services/${id}`),

  // --- Coupons --------------------------------------------------------------
  getCoupons: () => api.get("/admin/coupons").then(({ coupons }) => coupons),
  getCoupon: (id) => api.get(`/admin/coupons/${id}`),
  createCoupon: (payload) => api.post("/admin/coupons", payload).then(({ coupon }) => coupon),
  updateCoupon: (id, payload) =>
    api.put(`/admin/coupons/${id}`, payload).then(({ coupon }) => coupon),
  setCouponActive: (id, active) => api.patch(`/admin/coupons/${id}/status`, { active }),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),

  // --- People ---------------------------------------------------------------
  getCustomers: () => api.get("/admin/customers").then(({ customers }) => customers),
  getServiceBoys: () => api.get("/admin/serviceboys").then(({ serviceBoys }) => serviceBoys),
  createServiceBoy: (payload) => api.post("/admin/serviceboys", payload),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload).then(({ user }) => user),
  setUserActive: (id, active) => api.patch(`/admin/users/${id}/status`, { active }),
  resetUserPassword: (id) => api.post(`/admin/users/${id}/reset-password`),

  // --- Expenses -------------------------------------------------------------
  getExpenses: () => api.get("/admin/expenses").then(({ expenses }) => expenses),
  createExpense: (payload) => api.post("/admin/expenses", payload).then(({ expense }) => expense),
  updateExpense: (id, payload) =>
    api.put(`/admin/expenses/${id}`, payload).then(({ expense }) => expense),
  deleteExpense: (id) => api.delete(`/admin/expenses/${id}`),

  // --- Settings and enquiries ----------------------------------------------
  updateSettings: (payload) => api.put("/admin/settings", payload).then(({ settings }) => settings),
  getSlackStatus: () => api.get("/admin/slack/status"),
  sendSlackTest: () => api.post("/admin/slack/test"),
  getContactMessages: () => api.get("/admin/contact-messages").then(({ messages }) => messages),
  setContactMessageHandled: (id, handled) => api.patch(`/admin/contact-messages/${id}`, { handled }),
};

export const serviceBoyClient = {
  getBookings: () => api.get("/serviceboy/bookings").then(({ bookings }) => bookings),
  updateStatus: (id, status) =>
    api.patch(`/serviceboy/bookings/${id}/status`, { status }).then(({ booking }) => booking),
};
