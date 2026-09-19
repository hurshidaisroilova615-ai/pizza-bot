// One deployed front end can serve several businesses. The API address
// arrives as ?api=... — set once in the admin link — so a new client needs
// one new backend rather than a backend plus its own copy of this page. It
// is remembered because the router drops the query string on navigation.
//
// Only Render addresses are accepted: the parameter comes from a link, and
// a link can be forwarded by anyone, so it must not be able to point a
// login form at an arbitrary host.
const STORAGE_KEY = "api_base_url";
// Every backend this browser has opened, so the owner of several shops can
// move between them on purpose. Before this, the page silently showed
// whichever one happened to be opened last: you opened "Fedya's admin",
// the link carried no ?api=, and Dom Pizza's orders came up instead.
const KNOWN_KEY = "api_known_bases";

function isAcceptable(url) {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:" && hostname !== "localhost" && hostname !== "127.0.0.1") return false;
    return hostname.endsWith(".onrender.com") || hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // A private window refuses storage; the link still works for this visit.
  }
}

export function knownBases() {
  try {
    const parsed = JSON.parse(read(KNOWN_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((b) => b && isAcceptable(b.url)) : [];
  } catch {
    return [];
  }
}

function rememberBase(url) {
  write(STORAGE_KEY, url);
  const list = knownBases();
  if (!list.some((b) => b.url === url)) {
    list.push({ url, name: null });
    write(KNOWN_KEY, JSON.stringify(list));
  }
}

// The business name only arrives once the panel has loaded its settings, so
// the switcher can show "Fedya Shaurma" rather than a hostname.
export function nameBase(url, name) {
  if (!name) return;
  const list = knownBases();
  const entry = list.find((b) => b.url === url);
  if (!entry || entry.name === name) return;
  entry.name = name;
  write(KNOWN_KEY, JSON.stringify(list));
}

export function switchBase(url) {
  if (!isAcceptable(url)) return;
  write(STORAGE_KEY, url);
  // A full reload rather than a state update: every page, the auth token and
  // all cached data belong to the old business and must be dropped.
  window.location.href = `${window.location.origin}${window.location.pathname}`;
}

export function forgetBase(url) {
  write(KNOWN_KEY, JSON.stringify(knownBases().filter((b) => b.url !== url)));
}

export function resolveApiBase() {
  const fromLink = new URLSearchParams(window.location.search).get("api");
  if (fromLink && isAcceptable(fromLink)) {
    const clean = fromLink.replace(/\/+$/, "");
    rememberBase(clean);
    return clean;
  }

  const saved = read(STORAGE_KEY);
  if (saved && isAcceptable(saved)) {
    rememberBase(saved);
    return saved;
  }

  return import.meta.env.VITE_API_URL || "http://localhost:4000/api";
}

// Shown in the sidebar so it is always obvious which shop is on screen.
export function baseLabel(url) {
  try {
    return new URL(url).hostname.replace(/\.onrender\.com$/, "");
  } catch {
    return url;
  }
}
