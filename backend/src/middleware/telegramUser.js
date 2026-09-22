const { verifyInitData } = require("../lib/telegramAuth");
const { webCustomerId } = require("../lib/webCustomer");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOW_INSECURE_FALLBACK = process.env.NODE_ENV !== "production";

// Identifies the customer behind a request, by whichever of the two doors
// they came through.
//
// Through Telegram: the Mini App sends the signed `initData` payload in
// X-Telegram-Init-Data, and the signature is checked here rather than
// trusting a client-supplied id, which would let anyone order as anyone.
//
// Through the shop's own web address: there is no Telegram and no signature
// to check. The browser sends the random id it keeps for itself in
// X-Guest-Id, and that becomes a "web:" account of its own. Nobody can
// guess another customer's id, and the prefix means no forged header can
// ever land on a real Telegram account (see lib/webCustomer.js).
function telegramUser(req, res, next) {
  const initData = req.headers["x-telegram-init-data"];
  const verified = initData ? verifyInitData(initData, BOT_TOKEN) : null;

  if (verified) {
    req.telegramUser = {
      telegramId: String(verified.id),
      firstName: verified.first_name || "",
      lastName: verified.last_name || "",
      username: verified.username || null,
      languageCode: verified.language_code || null,
      viaWeb: false,
    };
    return next();
  }

  const webId = webCustomerId(req.headers["x-guest-id"]);
  if (webId) {
    // A web customer has no profile to read, so their name arrives with the
    // order they are placing and is kept on the account from then on.
    req.telegramUser = {
      telegramId: webId,
      firstName: String(req.body?.customerName || req.body?.firstName || "").trim().slice(0, 60),
      lastName: "",
      username: null,
      languageCode: null,
      viaWeb: true,
    };
    return next();
  }

  if (ALLOW_INSECURE_FALLBACK) {
    const telegramId = req.body?.telegramId || req.query?.telegramId;
    if (telegramId) {
      req.telegramUser = {
        telegramId: String(telegramId),
        firstName: req.body?.firstName || "Mehmon",
        lastName: "",
        username: null,
        languageCode: null,
        viaWeb: false,
      };
      return next();
    }
  }

  return res.status(401).json({ error: "Telegram autentifikatsiyasi muvaffaqiyatsiz" });
}

module.exports = telegramUser;
