const crypto = require("crypto");
const TelegramBot = require("node-telegram-bot-api");
const prisma = require("./lib/prisma");
const { getSettings } = require("./lib/settings");

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN .env faylida topilmadi!");
}

// Render exposes the service's own public URL, so webhook mode configures
// itself on deploy. Long polling stops whenever a free instance sleeps, and
// nothing wakes it — a webhook lets Telegram's own request do the waking.
// Locally neither variable is set, so we keep polling.
const WEBHOOK_BASE = process.env.BOT_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL || "";
const USE_WEBHOOK = Boolean(WEBHOOK_BASE);
const bot = new TelegramBot(token, { polling: !USE_WEBHOOK });

// A digest of the token rather than the token itself: the raw token contains
// a colon, which Express would parse as a route parameter, and it would also
// sit in plain sight in request logs. The digest stays unguessable without
// the token and is stable across restarts.
const WEBHOOK_PATH = `/api/bot/webhook/${crypto
  .createHash("sha256")
  .update(token)
  .digest("hex")
  .slice(0, 32)}`;

// How the bot is currently receiving messages, and whether that is working.
// Sending and receiving are separate paths: the server can push an order
// alert to Telegram while Telegram cannot reach the server at all, which
// looks from the outside like "the bot answers sometimes". Telegram is the
// only party that knows why its own delivery is failing, so we ask it.
let transport = { mode: USE_WEBHOOK ? "webhook" : "polling", ready: false, why: "hali tekshirilmadi" };

if (USE_WEBHOOK) {
  bot
    .setWebHook(`${WEBHOOK_BASE}${WEBHOOK_PATH}`)
    .then(() => {
      transport = { mode: "webhook", ready: true, why: "o'rnatildi" };
      console.log(`✅ Webhook o'rnatildi: ${WEBHOOK_BASE}${WEBHOOK_PATH}`);
    })
    .catch(async (err) => {
      // Never leave the bot with neither transport: fall back to polling,
      // clearing any webhook Telegram still holds so getUpdates isn't 409'd.
      console.error("Webhook o'rnatilmadi, polling rejimiga qaytilmoqda:", err.message);
      try {
        await bot.deleteWebHook();
        await bot.startPolling();
        transport = { mode: "polling", ready: true, why: `webhook o'rnatilmadi: ${err.message}` };
      } catch (fallbackErr) {
        transport = { mode: "yo'q", ready: false, why: `webhook ham, polling ham ishlamadi: ${fallbackErr.message}` };
        console.error("Polling'ga qaytishda ham xatolik:", fallbackErr.message);
      }
    });
} else {
  transport = { mode: "polling", ready: true, why: "webhook manzili yo'q, polling ishlatilmoqda" };
}

// Telegram holds an update it could not deliver and sends it the moment the
// service answers again. After a restart or a cold start that arrives as a
// burst: four taps of /start twenty minutes ago produced four welcome
// messages at once, which reads as a bot gone haywire. An update older than
// this is answered by nobody — whoever sent it has long since given up or
// tried again, and a reply to it now is noise.
const STALE_AFTER_SECONDS = 120;

function updateAge(update) {
  const at =
    update?.message?.date ??
    update?.edited_message?.date ??
    update?.callback_query?.message?.date;
  if (!at) return 0;
  return Math.max(0, Math.floor(Date.now() / 1000) - at);
}

function isFresh(update) {
  return updateAge(update) <= STALE_AFTER_SECONDS;
}

// Telegram keeps the reason its own deliveries fail; nothing on this side
// can see it. Asked at most once a minute so a health page that is being
// refreshed does not hammer the API.
let webhookCache = { at: 0, value: null };

async function botDelivery() {
  const base = { ...transport };
  if (!USE_WEBHOOK) return base;

  if (Date.now() - webhookCache.at < 60000 && webhookCache.value) {
    return { ...base, ...webhookCache.value };
  }

  try {
    const info = await bot.getWebHookInfo();
    let host = null;
    try {
      host = info.url ? new URL(info.url).host : null;
    } catch {
      host = "noto'g'ri manzil";
    }
    const expected = (() => {
      try {
        return new URL(WEBHOOK_BASE).host;
      } catch {
        return null;
      }
    })();
    const value = {
      // The path carries a digest of the bot token and is what authenticates
      // an incoming update, so only the host of it is ever reported.
      webhookHost: host,
      pointsHere: Boolean(host && expected && host === expected),
      waitingUpdates: info.pending_update_count ?? 0,
      lastErrorAt: info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : null,
      lastError: info.last_error_message || null,
    };
    webhookCache = { at: Date.now(), value };
    return { ...base, ...value };
  } catch (err) {
    return { ...base, webhookCheckFailed: err.message };
  }
}

// Falls back to localhost during local development; in production this must
// be the deployed HTTPS URL of the miniapp (see DEPLOYMENT.md).
const MINIAPP_BASE = process.env.MINIAPP_PUBLIC_URL || "http://localhost:5173";

// One Mini App serves every shop, and which backend it talks to comes from
// ?api= on the link. Leaving that to be typed into an environment variable
// by hand meant a shop whose link was missing it fell back to whichever
// shop the customer's phone had opened last — Dom Pizza's bot showing
// Fedya's menu. The backend knows its own address, so it puts itself on
// the link and the question stops arising.
function miniappUrl() {
  const self = (process.env.BOT_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL || "").replace(
    /\/+$/,
    ""
  );
  if (!self) return MINIAPP_BASE;
  try {
    const url = new URL(MINIAPP_BASE);
    // An address set deliberately on the link is left alone.
    if (url.searchParams.get("api")) return MINIAPP_BASE;
    url.searchParams.set("api", `${self}/api`);
    return url.toString();
  } catch {
    return MINIAPP_BASE;
  }
}

const MINIAPP_URL = miniappUrl();

const { STATUS_LABELS, statusLabel } = require("./lib/orderLabels");
const {
  messagesFor,
  statusLabelFor,
  effectiveLanguage,
  LANGUAGE_CHOICES,
  SUPPORTED,
} = require("./lib/botMessages");

function orderButton(languageCode) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: messagesFor(languageCode).orderButton, web_app: { url: MINIAPP_URL } }],
      ],
    },
  };
}

// The square beside the message box. It used to be set by hand in BotFather,
// which meant every new shop needed a step nobody remembered, and a bot set
// up against a temporary tunnel kept pointing at it long after the tunnel
// was gone — the customer tapped it and got an error page from ngrok. The
// bot owns it now, so it is correct from the first deploy and corrects
// itself on the next one whenever the address changes.
async function syncMenuButton() {
  if (!/^https:\/\//.test(MINIAPP_URL)) {
    console.log(
      `ℹ️  Menyu tugmasi qo'yilmadi — MINIAPP_PUBLIC_URL https bo'lishi kerak (hozir: ${MINIAPP_URL})`
    );
    return false;
  }
  try {
    await bot.setChatMenuButton({
      menu_button: JSON.stringify({
        type: "web_app",
        text: messagesFor().menuButton,
        web_app: { url: MINIAPP_URL },
      }),
    });
    console.log(`✅ Telegram menyu tugmasi qo'yildi → ${MINIAPP_URL}`);
    return true;
  } catch (err) {
    console.error("❌ Menyu tugmasini qo'yib bo'lmadi:", err.message);
    return false;
  }
}

// Offered once, on a first /start, and again whenever someone sends /til.
// Each label is in its own language so a customer who cannot read the other
// two still finds theirs.
function languageKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: LANGUAGE_CHOICES.map((c) => [
        { text: c.label, callback_data: `lang:${c.code}` },
      ]),
    },
  };
}

async function sendWelcome(chatId, user, firstName) {
  const settings = await getSettings().catch(() => null);
  const businessName = settings?.businessName || "SmartOrder";
  const lang = effectiveLanguage(user);
  const m = messagesFor(lang);
  // An owner who has written their own welcome gets it sent as they wrote
  // it. Translating someone's own words into a language they never checked
  // is worse than showing them in one language.
  const welcome = settings?.welcomeMessage
    ? settings.welcomeMessage
    : `${m.greeting.replace("!", `, ${firstName}!`)}\n\n${m.welcome(businessName)} ${m.orderPrompt}`;

  return notifySafe(chatId, `${welcome}\n\n${m.languageCommand}`, orderButton(lang));
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  const firstName = msg.from.first_name || "";

  let user = null;
  try {
    user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        firstName,
        lastName: msg.from.last_name || null,
        username: msg.from.username || null,
        languageCode: msg.from.language_code || null,
      },
      create: {
        telegramId,
        firstName,
        lastName: msg.from.last_name || null,
        username: msg.from.username || null,
        languageCode: msg.from.language_code || null,
      },
    });
  } catch (err) {
    console.error("Foydalanuvchini saqlashda xatolik:", err.message);
  }

  // Asked once, on the very first /start. Telegram's own language is only a
  // guess — plenty of people here read Uzbek on a phone set to Russian — so
  // the customer says which they want before anything else is put in front
  // of them. After that the bot never asks again.
  if (!user?.language) {
    return bot.sendMessage(chatId, messagesFor(msg.from.language_code).chooseLanguage, languageKeyboard());
  }

  return sendWelcome(chatId, user, firstName);
});

bot.onText(/\/til|\/language|\/yazyk/, (msg) => {
  bot.sendMessage(msg.chat.id, messagesFor(msg.from.language_code).chooseLanguage, languageKeyboard());
});

bot.on("callback_query", async (query) => {
  const data = query.data || "";
  if (!data.startsWith("lang:")) return;

  const code = data.slice(5);
  const chatId = query.message?.chat?.id;
  if (!SUPPORTED.includes(code) || !chatId) {
    return bot.answerCallbackQuery(query.id).catch(() => {});
  }

  const telegramId = String(query.from.id);
  let user = null;
  try {
    user = await prisma.user.update({
      where: { telegramId },
      data: { language: code },
    });
  } catch (err) {
    console.error("Tilni saqlashda xatolik:", err.message);
  }

  await bot.answerCallbackQuery(query.id, { text: messagesFor(code).languageSet }).catch(() => {});
  // The three buttons have done their job; leaving them sitting in the chat
  // invites a second tap that changes nothing.
  await bot
    .editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id })
    .catch(() => {});

  return sendWelcome(chatId, user || { language: code }, query.from.first_name || "");
});

// Setting up order alerts needs a chat id, and hunting one down otherwise
// means sending people to a third-party bot to find it.
bot.onText(/\/id/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Sizning Telegram ID raqamingiz:\n\n${msg.chat.id}\n\nYangi buyurtma xabarlarini olish uchun shu raqamni admin panel → Sozlamalar bo'limiga qo'ying.`
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "/start — Mini App'ni ochish\n/orders — Oxirgi buyurtmalaringiz\n/til — Tilni o'zgartirish\n/id — Telegram ID raqamingiz\n/help — Yordam"
  );
});

bot.onText(/\/orders/, async (msg) => {
  const telegramId = String(msg.from.id);
  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return bot.sendMessage(msg.chat.id, messagesFor(msg.from.language_code).noOrders);
    const lang = effectiveLanguage(user);

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    });

    if (orders.length === 0) {
      return bot.sendMessage(msg.chat.id, messagesFor(lang).noOrders);
    }

    const text = orders
      .map(
        (o) =>
          `#${o.id} — ${statusLabelFor(o, lang)}\n${o.items
            .map((i) => `${i.name} x${i.quantity}`)
            .join(", ")}\n${messagesFor(lang).total}: ${o.totalPrice.toLocaleString()}`
      )
      .join("\n\n");

    bot.sendMessage(msg.chat.id, text);
  } catch (err) {
    console.error("Buyurtmalarni yuborishda xatolik:", err.message);
  }
});

// Logs both outcomes: when a customer reports a missing notification, the
// logs have to show whether the send was attempted at all, and to whom.
async function notifySafe(chatId, text, opts) {
  const preview = text.split("\n")[0].slice(0, 60);
  try {
    await bot.sendMessage(chatId, text, opts);
    console.log(`📤 Telegram xabar yuborildi → ${chatId}: ${preview}`);
    return true;
  } catch (err) {
    console.error(`❌ Telegram xabar yuborilmadi → ${chatId}: ${preview} — ${err.message}`);
    return false;
  }
}

async function notifyOrderCreated(telegramId, order, languageCode) {
  const m = messagesFor(languageCode);
  return notifySafe(telegramId, m.orderCreated(order.id, order.totalPrice.toLocaleString()));
}

async function notifyOrderStatusChanged(telegramId, order, languageCode) {
  const m = messagesFor(languageCode);
  return notifySafe(telegramId, m.statusChanged(order.id, statusLabelFor(order, languageCode)));
}

async function notifyOffer(telegramId, offer) {
  return notifySafe(telegramId, `🎁 ${offer.title}\n\n${offer.message}`);
}

// Recipients come from the business settings so an owner can change who
// gets order alerts from the admin panel; the environment variable stays
// as a fallback for deployments configured before that existed.
async function notifyAdmins(text) {
  let configured = process.env.ADMIN_CHAT_IDS || "";
  try {
    const settings = await getSettings();
    if (settings.orderNotifyChatIds) configured = settings.orderNotifyChatIds;
  } catch (err) {
    console.error("Sozlamalarni o'qishda xatolik:", err.message);
  }

  const chatIds = configured
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await Promise.all(chatIds.map((id) => notifySafe(id, text)));
}

module.exports = {
  bot,
  USE_WEBHOOK,
  WEBHOOK_PATH,
  notifyOrderCreated,
  notifyOrderStatusChanged,
  syncMenuButton,
  miniappUrl,
  botDelivery,
  isFresh,
  updateAge,
  STALE_AFTER_SECONDS,
  notifyOffer,
  notifyAdmins,
  STATUS_LABELS,
};
