const crypto = require("crypto");
const TelegramBot = require("node-telegram-bot-api");
const prisma = require("./lib/prisma");
const { getSettings } = require("./lib/settings");

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN .env faylida topilmadi!");
}

const USE_WEBHOOK = Boolean(process.env.BOT_WEBHOOK_URL);
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
  bot.setWebHook(`${process.env.BOT_WEBHOOK_URL}${WEBHOOK_PATH}`).catch((err) => {
    console.error("Webhook o'rnatishda xatolik:", err.message);
  });
}

// Falls back to localhost during local development; in production this must
// be the deployed HTTPS URL of the miniapp (see DEPLOYMENT.md).
const MINIAPP_URL = process.env.MINIAPP_PUBLIC_URL || "http://localhost:5173";

const STATUS_LABELS = {
  PENDING: "Qabul qilindi ✅",
  PREPARING: "Tayyorlanmoqda 👨‍🍳",
  ON_DELIVERY: "Kuryerda 🚚",
  DELIVERED: "Yetkazildi 🎉",
  CANCELLED: "Bekor qilindi ❌",
};

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

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "/start — Mini App'ni ochish\n/orders — Oxirgi buyurtmalaringiz\n/help — Yordam"
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
          `#${o.id} — ${STATUS_LABELS[o.status] || o.status}\n${o.items
            .map((i) => `${i.name} x${i.quantity}`)
            .join(", ")}\nJami: ${o.totalPrice.toLocaleString()}`
      )
      .join("\n\n");

    bot.sendMessage(msg.chat.id, text);
  } catch (err) {
    console.error("Buyurtmalarni yuborishda xatolik:", err.message);
  }
});

async function notifySafe(chatId, text, opts) {
  try {
    await bot.sendMessage(chatId, text, opts);
    return true;
  } catch (err) {
    console.error("Bot xabar yuborishda xatolik:", err.message);
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
  const label = STATUS_LABELS[order.status] || order.status;
  return notifySafe(telegramId, `Buyurtmangiz #${order.id} holati yangilandi:\n${label}`);
}

async function notifyOffer(telegramId, offer) {
  return notifySafe(telegramId, `🎁 ${offer.title}\n\n${offer.message}`);
}

async function notifyAdmins(text) {
  const chatIds = (process.env.ADMIN_CHAT_IDS || "")
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
