// Who is ordering, whichever way they arrived.
//
// Inside Telegram the answer comes from Telegram and is signed, so the
// backend can trust it. On the shop's own web address there is nobody to
// ask, so this browser makes an id for itself once and keeps it. That id
// is what makes "my orders" mean anything on a website — without it every
// visitor would share one account and read each other's orders.
import { getTelegramUser, isInsideTelegram } from "./telegram";

const GUEST_KEY = "web_customer_id";
const CONTACT_KEY = "web_customer_contact";

// The same shape the backend accepts: letters, digits, - and _, long
// enough that nobody guesses somebody else's.
function newId() {
  const bytes = new Uint8Array(24);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Private mode, blocked storage and some in-app browsers all throw on
// localStorage. The id then lasts for the page instead of forever, which
// is enough to place an order and see it confirmed.
let inMemoryId = null;

export function webCustomerId() {
  try {
    const stored = localStorage.getItem(GUEST_KEY);
    if (stored) return stored;
    const fresh = newId();
    localStorage.setItem(GUEST_KEY, fresh);
    return fresh;
  } catch {
    if (!inMemoryId) inMemoryId = newId();
    return inMemoryId;
  }
}

export function isTelegram() {
  return isInsideTelegram();
}

// A web customer types their name, phone and address once. Asking again on
// the next order is the difference between a website someone orders from
// twice and one they order from once.
export function savedContact() {
  try {
    const raw = localStorage.getItem(CONTACT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function rememberContact(contact) {
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
  } catch {
    // nothing to remember with; the customer types it again next time
  }
}

// What the app shows as "you". Telegram gives a real name; the website
// knows one only after the first order.
export function currentCustomer() {
  const tg = getTelegramUser();
  if (tg) return { ...tg, viaWeb: false };
  const contact = savedContact();
  return {
    telegramId: `web:${webCustomerId()}`,
    firstName: contact.name || "",
    lastName: "",
    username: "",
    viaWeb: true,
  };
}
