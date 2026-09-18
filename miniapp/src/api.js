import { resolveApiBase } from "./apiBase";
import { getInitData, getTelegramUser } from "./telegram";

const BASE_URL = resolveApiBase();

async function request(path, options = {}) {
  const telegramUser = getTelegramUser();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getInitData(),
      ...options.headers,
    },
    body:
      options.body && typeof options.body === "string"
        ? withFallbackUser(options.body, telegramUser)
        : options.body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "So'rovda xatolik yuz berdi");
  }
  if (res.status === 204) return null;
  return res.json();
}

// Outside real Telegram (local browser dev) there's no signed initData, so
// we also send telegramId/firstName in the body — the backend only trusts
// this fallback when NODE_ENV !== production (see telegramUser middleware).
function withFallbackUser(body, telegramUser) {
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify({ telegramId: telegramUser.telegramId, firstName: telegramUser.firstName, ...parsed });
  } catch {
    return body;
  }
}

function withQuery(path, params = {}) {
  const telegramUser = getTelegramUser();
  const query = new URLSearchParams({ telegramId: telegramUser.telegramId, ...params }).toString();
  return `${path}?${query}`;
}

export const api = {
  getSettings: () => request("/settings"),
  getCategories: () => request("/categories"),
  getProducts: () => request("/products"),
  getProduct: (id) => request(`/products/${id}`),
  getTopProducts: () => request("/products/top"),

  upsertUser: (data) => request("/users/upsert", { method: "POST", body: JSON.stringify(data || {}) }),
  getMe: () => request(withQuery("/users/me")),

  getLoyalty: () => request(withQuery("/loyalty/me")),
  getOffers: () => request(withQuery("/offers/for-me")),

  quoteOrder: (data) => request("/orders/quote", { method: "POST", body: JSON.stringify(data) }),
  createOrder: (data) => request("/orders", { method: "POST", body: JSON.stringify(data) }),
  getMyOrders: () => request(withQuery("/orders/me/list")),

  validatePromoCode: (code, subtotal) =>
    request("/promo-codes/validate", { method: "POST", body: JSON.stringify({ code, subtotal }) }),
};
