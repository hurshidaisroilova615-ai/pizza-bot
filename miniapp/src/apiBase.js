// One deployed front end serves every business. Which backend it talks to
// arrives as ?api=... on the link the bot opens, so a new client needs one
// new backend rather than a backend plus its own copy of this page.
//
// It used to be remembered in localStorage, which is for ever and shared by
// every shop the phone has opened. A customer who had ordered from one shop
// and then opened another bot whose link was missing ?api= was shown the
// first shop's menu, prices and opening hours — and could order from it.
// The backend now stamps its own address onto the link it opens, so the
// answer is on the URL every time; what is kept here is only a fallback for
// the rest of one visit, because an in-app router drops the query string on
// later navigations. sessionStorage ends with the webview, so it can never
// carry one shop into another.
//
// Only Render addresses are accepted: the parameter comes from a link, and
// a link can be forwarded by anyone, so it must not be able to point the
// page at an arbitrary host.
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
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function remember(url) {
  try {
    sessionStorage.setItem(STORAGE_KEY, url);
    // Clear the old permanent copy, so a phone that opened a shop before
    // this change stops being handed it.
    localStorage.removeItem(STORAGE_KEY);
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

  try {
    // Nothing on the link and nothing from this visit: a value left behind
    // by an older version belongs to whichever shop was opened last, which
    // is exactly the confusion this file exists to end.
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked; there was nothing to remove anyway
  }

  return import.meta.env.VITE_API_URL || "http://localhost:4000/api";
}
