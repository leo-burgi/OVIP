import axios from "axios";

const rawBackendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const BACKEND_URL = rawBackendUrl.replace(/\/+$/, "").replace(/\/api$/, "");
export const API_URL = `${BACKEND_URL}/api`;

const normalizeArrayResponse = (promise, label) =>
  promise.then((response) => {
    if (Array.isArray(response.data)) {
      return response;
    }

    console.error(
      `[OVIP] La API de ${label} no devolvió un array. Revisá REACT_APP_BACKEND_URL y el estado del backend.`,
      response.data
    );
    response.data = [];
    return response;
  });

const normalizeObjectResponse = (promise, fallback, label) =>
  promise.then((response) => {
    if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
      return response;
    }

    console.error(
      `[OVIP] La API de ${label} no devolvió un objeto válido. Revisá REACT_APP_BACKEND_URL y el estado del backend.`,
      response.data
    );
    response.data = fallback;
    return response;
  });

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

api.interceptors.response.use(
  (response) => {
    const contentType = response.headers?.["content-type"] || "";
    if (typeof response.data === "string" && contentType.includes("text/html")) {
      console.error(
        `[OVIP] La llamada a ${response.config?.url} devolvió HTML. Casi seguro el frontend está apuntando a sí mismo y no al backend. Variable actual: REACT_APP_BACKEND_URL=${BACKEND_URL}`
      );
    }
    return response;
  },
  (error) => {
    console.error("[OVIP] Error de API", {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export const authApi = {
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const productsApi = {
  getAll: (params) => normalizeArrayResponse(api.get("/products", { params }), "productos"),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/admin/products", data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`),
};

export const categoriesApi = {
  getAll: () => normalizeArrayResponse(api.get("/categories"), "categorías"),
};

export const cartApi = {
  get: () => normalizeObjectResponse(api.get("/cart"), { items: [] }, "carrito"),
  add: (productId, quantity) => api.post("/cart/add", { product_id: productId, quantity }),
  remove: (productId) => api.delete(`/cart/remove/${productId}`),
  update: (productId, quantity) => api.put(`/cart/update/${productId}`, null, { params: { quantity } }),
};

export const ordersApi = {
  create: (data) => api.post("/orders", data),
  getById: (id) => api.get(`/orders/${id}`),
  getAdminAll: () => normalizeArrayResponse(api.get("/admin/orders"), "órdenes"),
};

export const mpApi = {
  createPreference: (orderId) => api.post("/payments/mercadopago/preference", { order_id: orderId }),
  getOrderStatus: (orderId) => api.get(`/payments/mercadopago/order-status/${orderId}`),
};
