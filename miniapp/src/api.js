import { resolveApiBase } from "./apiBase";
import { getInitData, getTelegramUser } from "./telegram";

const BASE_URL = resolveApiBase();

// A sleeping free instance does not answer the first request that wakes it:
// it may hang, or the platform may answer 502 while the container starts.
// Retrying a read a few times is the difference between a customer seeing
// the menu a moment later and deciding the shop's bot is broken. Only reads
// are retried — an order must never be placed twice.
// A cold start on a free instance runs to about half a minute, so the
// window is generous: better a customer waits than sees an empty shop.
const RETRY_WINDOW_MS = 60000;
const RETRY_DELAYS = [1000, 2000, 4000];

function retryDelay(attempt) {
  return RETRY_DELAYS[attempt] ?? 8000;
}

function isRetriable(status) {
  return status === 502 || status === 503 || status === 504;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, options = {}) {
  const telegramUser = getTelegramUser();
  const isRead = !options.method || options.method === "GET";
  const startedAt = Date.now();
  const mayRetry = () => isRead && Date.now() - startedAt < RETRY_WINDOW_MS;

  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
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
    } catch (networkError) {
      if (mayRetry()) {
        await wait(retryDelay(attempt));
        continue;
      }
      throw networkError;
    }

    if (!res.ok) {
      if (isRetriable(res.status) && mayRetry()) {
        await wait(retryDelay(attempt));
        continue;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "So'rovda xatolik yuz berdi");
    }

    if (res.status === 204) return null;
    return res.json();
  }
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
