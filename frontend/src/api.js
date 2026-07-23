const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Terjadi kesalahan pada server.");
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),
  forgotPassword: (payload) => request("/auth/forgot-password", { method: "POST", body: payload }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload }),
  updateProfile: (payload) => request("/auth/profile", { method: "PUT", body: payload }),

  // Services
  getServices: () => request("/services"),
  getAllServices: () => request("/services/all"),
  createService: (payload) => request("/services", { method: "POST", body: payload }),
  updateService: (id, payload) => request(`/services/${id}`, { method: "PUT", body: payload }),
  deactivateService: (id) => request(`/services/${id}`, { method: "DELETE" }),

  // Addresses
  getAddresses: () => request("/addresses"),
  createAddress: (payload) => request("/addresses", { method: "POST", body: payload }),
  deleteAddress: (id) => request(`/addresses/${id}`, { method: "DELETE" }),
  updateAddress: (id, payload) => request(`/addresses/${id}`, { method: "PUT", body: payload }),

  // Regions Proxy
  getProvinces: () => request("/regions/provinces"),
  getRegencies: (provinceId) => request(`/regions/regencies/${provinceId}`),
  getDistricts: (regencyId) => request(`/regions/districts/${regencyId}`),
  getVillages: (districtId) => request(`/regions/villages/${districtId}`),

  // Orders
  createOrder: (payload) => request("/orders", { method: "POST", body: payload }),
  getMyOrders: () => request("/orders/mine"),
  getAllOrders: (status) => request(`/orders${status ? `?status=${status}` : ""}`),
  getOrderDetail: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, payload) => request(`/orders/${id}/status`, { method: "PATCH", body: payload }),
  updateOrderPayment: (id, payload) => request(`/orders/${id}/payment`, { method: "PATCH", body: payload }),

  // Admin stats, customers & order history
  getAdminStats: (month, year) => request(`/admin/stats?month=${month || "all"}&year=${year || "all"}`),
  getCustomers: () => request("/admin/customers"),
  createCustomer: (payload) => request("/admin/customers", { method: "POST", body: payload }),
  getCustomerOrders: (id) => request(`/admin/customers/${id}/orders`),

  // Submit payment method and proof
  submitPayment: async (id, formData) => {
    const headers = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/orders/${id}/submit-payment`, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Gagal mengirim pembayaran.");
    return data;
  },

  // Reviews
  getReviews: () => request("/reviews"),
  getOrderReview: (orderId) => request(`/reviews/order/${orderId}`),
  submitReview: (payload) => request("/reviews", { method: "POST", body: payload }),
  submitReviewReply: (id, payload) => request(`/reviews/${id}/reply`, { method: "POST", body: payload }),

  // Settings & Loyalty Discounts
  getSettings: () => request("/settings"),
  updateSettings: (payload) => request("/settings", { method: "PUT", body: payload }),
  getCustomerDiscountStatus: () => request("/settings/customer-status"),

  // Gudang Stok (Inventory)
  getInventory: () => request("/inventory"),
  getInventoryLogs: () => request("/inventory/logs"),
  restockInventory: (payload) => request("/inventory/restock", { method: "POST", body: payload }),
  updateInventory: (id, payload) => request(`/inventory/${id}`, { method: "PUT", body: payload }),
};
