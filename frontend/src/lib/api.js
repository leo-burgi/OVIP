import axios from "axios";

const rawBackendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const BACKEND_URL = rawBackendUrl.replace(/\/$/, "");
export const API_URL = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const adminKey = window.localStorage.getItem("OVIP_ADMIN_KEY");
  if (adminKey) {
    config.headers["X-Admin-Key"] = adminKey;
  }
  return config;
});

export const authApi = {
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const productsApi = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/admin/products", data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`),
};

export const categoriesApi = {
  getAll: () => api.get("/categories"),
};

export const cartApi = {
  get: () => api.get("/cart"),
  add: (productId, quantity) => api.post("/cart/add", { product_id: productId, quantity }),
  remove: (productId) => api.delete(`/cart/remove/${productId}`),
  update: (productId, quantity) => api.put(`/cart/update/${productId}`, null, { params: { quantity } }),
};

export const ordersApi = {
  create: (data) => api.post("/orders", data),
  getById: (id) => api.get(`/orders/${id}`),
  getAdminAll: () => api.get("/admin/orders"),
};

export const mpApi = {
  createPreference: (orderId) => api.post("/payments/mercadopago/preference", { order_id: orderId }),
  getOrderStatus: (orderId) => api.get(`/payments/mercadopago/order-status/${orderId}`),
};
