// Ordering from a plain web address, without Telegram.
//
// Inside Telegram the customer arrives already identified: the app hands us
// a signed account. On a shop's own website nobody does, and yet the person
// standing there is just as much a customer. So the browser carries a random
// id it made for itself, and the account it opens is named after it.
//
// The "web:" prefix is the whole security argument. A Telegram account is
// always a number, so nothing this file produces can collide with a real
// Telegram customer, and a forged header can never reach one's orders.
const WEB_PREFIX = "web:";

// Long enough that guessing someone else's is hopeless, and narrow enough
// that nothing but an id can be smuggled through the header.
const ID_SHAPE = /^[A-Za-z0-9_-]{16,64}$/;

function isWebCustomer(telegramId) {
  return String(telegramId || "").startsWith(WEB_PREFIX);
}

// Telegram chat ids are numbers. Handing it anything else earns a 400 and
// an error line about a customer who never had a Telegram account at all,
// so every outgoing message is checked against this first.
function isTelegramChat(chatId) {
  return /^-?\d+$/.test(String(chatId || "").trim());
}

// Returns the account name for a browser-supplied id, or null if the id is
// not one we would have issued.
function webCustomerId(raw) {
  const id = String(raw || "").trim();
  return ID_SHAPE.test(id) ? WEB_PREFIX + id : null;
}

// Phone numbers arrive written however the customer types them:
// +998 90 123-45-67, 90 123 45 67, (0555) 12-34-56. Those are one person,
// so only the digits are compared, and only the last nine of them — which
// is the whole number in both Uzbekistan and Kyrgyzstan, with or without
// the country code in front.
function phoneKey(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  return digits.slice(-9);
}

module.exports = { WEB_PREFIX, ID_SHAPE, isWebCustomer, isTelegramChat, webCustomerId, phoneKey };
