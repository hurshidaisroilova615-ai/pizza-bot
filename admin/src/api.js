const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const TOKEN_KEY = "admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    setToken(null);
    onUnauthorized();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "So'rovda xatolik yuz berdi");
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  getSummary: () => request("/analytics/summary"),

  getOrders: (status) => request(`/orders${status ? `?status=${status}` : ""}`),
  getOrder: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, status, note) =>
    request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status, note }) }),

  getProducts: () => request("/products?all=1"),
  createProduct: (data) => request("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  getCategories: () => request("/categories?all=1"),
  createCategory: (data) => request("/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),

  getCustomers: (search) => request(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getCustomer: (id) => request(`/customers/${id}`),
  adjustLoyalty: (userId, points, note) =>
    request("/loyalty/adjust", { method: "POST", body: JSON.stringify({ userId, points, note }) }),

  getPromoCodes: () => request("/promo-codes"),
  createPromoCode: (data) => request("/promo-codes", { method: "POST", body: JSON.stringify(data) }),
  updatePromoCode: (id, data) => request(`/promo-codes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePromoCode: (id) => request(`/promo-codes/${id}`, { method: "DELETE" }),

  getOffers: () => request("/offers"),
  createOffer: (data) => request("/offers", { method: "POST", body: JSON.stringify(data) }),
  updateOffer: (id, data) => request(`/offers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOffer: (id) => request(`/offers/${id}`, { method: "DELETE" }),
  sendOffer: (id) => request(`/offers/${id}/send`, { method: "POST" }),

  getSettings: () => request("/settings"),
  updateSettings: (data) => request("/settings", { method: "PUT", body: JSON.stringify(data) }),
};
