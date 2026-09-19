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

if (USE_WEBHOOK) {
  bot
    .setWebHook(`${WEBHOOK_BASE}${WEBHOOK_PATH}`)
    .then(() => console.log(`✅ Webhook o'rnatildi: ${WEBHOOK_BASE}${WEBHOOK_PATH}`))
    .catch(async (err) => {
      // Never leave the bot with neither transport: fall back to polling,
      // clearing any webhook Telegram still holds so getUpdates isn't 409'd.
      console.error("Webhook o'rnatilmadi, polling rejimiga qaytilmoqda:", err.message);
      try {
        await bot.deleteWebHook();
        await bot.startPolling();
      } catch (fallbackErr) {
        console.error("Polling'ga qaytishda ham xatolik:", fallbackErr.message);
      }
    });
}

// Falls back to localhost during local development; in production this must
// be the deployed HTTPS URL of the miniapp (see DEPLOYMENT.md).
const MINIAPP_URL = process.env.MINIAPP_PUBLIC_URL || "http://localhost:5173";

const { STATUS_LABELS, statusLabel } = require("./lib/orderLabels");

function orderButton() {
  return {
    reply_markup: {
      inline_keyboard: [[{ text: "🛍 Buyurtma berish", web_app: { url: MINIAPP_URL } }]],
    },
  };
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  const firstName = msg.from.first_name || "";

  try {
    await prisma.user.upsert({
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

  const settings = await getSettings().catch(() => null);
  const businessName = settings?.businessName || "SmartOrder";
  const welcome =
    settings?.welcomeMessage ||
    `Assalomu alaykum, ${firstName}! 👋\n\n${businessName}ga xush kelibsiz. Buyurtma berish uchun pastdagi tugmani bosing.`;

  bot.sendMessage(chatId, welcome, orderButton());
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
    "/start — Mini App'ni ochish\n/orders — Oxirgi buyurtmalaringiz\n/id — Telegram ID raqamingiz\n/help — Yordam"
  );
});

bot.onText(/\/orders/, async (msg) => {
  const telegramId = String(msg.from.id);
  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return bot.sendMessage(msg.chat.id, "Sizda hali buyurtmalar yo'q.");

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    });

    if (orders.length === 0) {
      return bot.sendMessage(msg.chat.id, "Sizda hali buyurtmalar yo'q.");
    }

    const text = orders
      .map(
        (o) =>
          `#${o.id} — ${statusLabel(o)}\n${o.items
            .map((i) => `${i.name} x${i.quantity}`)
            .join(", ")}\nJami: ${o.totalPrice.toLocaleString()}`
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

async function notifyOrderCreated(telegramId, order) {
  return notifySafe(
    telegramId,
    `Buyurtmangiz #${order.id} qabul qilindi! ✅\nJami: ${order.totalPrice.toLocaleString()}\n\nHolatini shu botdan yoki Mini App profilingizdan kuzatib borishingiz mumkin.`
  );
}

async function notifyOrderStatusChanged(telegramId, order) {
  const label = statusLabel(order);
  return notifySafe(telegramId, `Buyurtmangiz #${order.id} holati yangilandi:\n${label}`);
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
  notifyOffer,
  notifyAdmins,
  STATUS_LABELS,
};
