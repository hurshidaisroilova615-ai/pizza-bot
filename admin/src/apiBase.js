// One deployed front end can serve several businesses. The API address
// arrives as ?api=... — set once in the bot's Mini App URL (or the admin
// link) — so a new client needs one new backend rather than a backend plus
// its own copy of this page. It is remembered because Telegram and the
// router both drop the query string on later navigations.
//
// Only Render addresses are accepted: the parameter comes from a link, and
// a link can be forwarded by anyone, so it must not be able to point a
// login form at an arbitrary host.
const STORAGE_KEY = "api_base_url";

function isAcceptable(url) {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:" && hostname !== "localhost" && hostname !== "127.0.0.1") return false;
    return hostname.endsWith(".onrender.com") || hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function remembered() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function remember(url) {
  try {
    localStorage.setItem(STORAGE_KEY, url);
  } catch {
    // A private window refuses storage; the link still works for this visit.
  }
}

export function resolveApiBase() {
  const fromLink = new URLSearchParams(window.location.search).get("api");
  if (fromLink && isAcceptable(fromLink)) {
    const clean = fromLink.replace(/\/+$/, "");
    remember(clean);
    return clean;
  }

  const saved = remembered();
  if (saved && isAcceptable(saved)) return saved;

  return import.meta.env.VITE_API_URL || "http://localhost:4000/api";
}
