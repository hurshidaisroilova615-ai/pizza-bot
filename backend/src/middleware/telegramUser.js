const { verifyInitData } = require("../lib/telegramAuth");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOW_INSECURE_FALLBACK = process.env.NODE_ENV !== "production";

// Authenticates Mini App requests using Telegram's signed `initData` payload
// (sent via the X-Telegram-Init-Data header) instead of trusting a client
// supplied telegramId, which would let anyone impersonate another customer.
//
// In non-production environments (local browser testing outside Telegram)
// we fall back to a body/query-supplied telegramId so the app stays usable
// during development, exactly like the original mock in telegram.js.
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
      };
      return next();
    }
  }

  return res.status(401).json({ error: "Telegram autentifikatsiyasi muvaffaqiyatsiz" });
}

module.exports = telegramUser;
