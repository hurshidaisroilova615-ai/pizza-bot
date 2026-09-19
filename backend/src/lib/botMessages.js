// What the bot says, in the three languages its customers read.
//
// The customer's Telegram language arrives with every message and is stored
// on the user row, so a Russian-speaking guest is answered in Russian
// without anyone choosing a setting. The shop's own words — the welcome
// text the owner writes in the admin panel, dish names — are never
// translated: they are that owner's writing, in whatever language they
// chose, and machine translating them produces nonsense on a screen they
// cannot fix.
const MESSAGES = {
  uz: {
    greeting: "Assalomu alaykum! 👋",
    welcome: (name) => `${name}ga xush kelibsiz.`,
    orderPrompt: "Buyurtma berish uchun pastdagi tugmani bosing.",
    orderButton: "🛍 Buyurtma berish",
    menuButton: "Menyu",
    chooseLanguage: "Tilni tanlang / Выберите язык / Choose your language",
    languageSet: "Til o'zbekchaga o'zgartirildi.",
    languageCommand: "Tilni o'zgartirish uchun /til deb yozing.",
    noOrders: "Sizda hali buyurtmalar yo'q.",
    orderCreated: (id, total) =>
      `Buyurtmangiz #${id} qabul qilindi! ✅\nJami: ${total}\n\nHolatini shu botdan yoki Mini App profilingizdan kuzatib borishingiz mumkin.`,
    statusChanged: (id, label) => `Buyurtmangiz #${id} holati yangilandi:\n${label}`,
    total: "Jami",
    status: {
      PENDING: "Qabul qilindi ✅",
      PREPARING: "Tayyorlanmoqda 👨‍🍳",
      ON_DELIVERY: "Kuryerda 🚚",
      DELIVERED: "Yetkazildi 🎉",
      CANCELLED: "Bekor qilindi ❌",
    },
    pickupStatus: {
      ON_DELIVERY: "Tayyor, olib ketishingiz mumkin 🛍",
      DELIVERED: "Topshirildi 🎉",
    },
  },
  ru: {
    greeting: "Здравствуйте! 👋",
    welcome: (name) => `Добро пожаловать в ${name}.`,
    orderPrompt: "Нажмите кнопку ниже, чтобы сделать заказ.",
    orderButton: "🛍 Сделать заказ",
    menuButton: "Меню",
    chooseLanguage: "Tilni tanlang / Выберите язык / Choose your language",
    languageSet: "Язык переключён на русский.",
    languageCommand: "Чтобы сменить язык, отправьте /til.",
    noOrders: "У вас пока нет заказов.",
    orderCreated: (id, total) =>
      `Заказ #${id} принят! ✅\nИтого: ${total}\n\nСледить за ним можно здесь или в профиле в приложении.`,
    statusChanged: (id, label) => `Статус заказа #${id} обновлён:\n${label}`,
    total: "Итого",
    status: {
      PENDING: "Принят ✅",
      PREPARING: "Готовится 👨‍🍳",
      ON_DELIVERY: "У курьера 🚚",
      DELIVERED: "Доставлен 🎉",
      CANCELLED: "Отменён ❌",
    },
    pickupStatus: {
      ON_DELIVERY: "Готов, можно забирать 🛍",
      DELIVERED: "Выдан 🎉",
    },
  },
  en: {
    greeting: "Hello! 👋",
    welcome: (name) => `Welcome to ${name}.`,
    orderPrompt: "Tap the button below to order.",
    orderButton: "🛍 Order now",
    menuButton: "Menu",
    chooseLanguage: "Tilni tanlang / Выберите язык / Choose your language",
    languageSet: "Language switched to English.",
    languageCommand: "Send /til to change the language.",
    noOrders: "You have no orders yet.",
    orderCreated: (id, total) =>
      `Order #${id} accepted! ✅\nTotal: ${total}\n\nYou can follow it here or in your profile in the app.`,
    statusChanged: (id, label) => `Order #${id} status updated:\n${label}`,
    total: "Total",
    status: {
      PENDING: "Accepted ✅",
      PREPARING: "Being cooked 👨‍🍳",
      ON_DELIVERY: "With the courier 🚚",
      DELIVERED: "Delivered 🎉",
      CANCELLED: "Cancelled ❌",
    },
    pickupStatus: {
      ON_DELIVERY: "Ready to collect 🛍",
      DELIVERED: "Collected 🎉",
    },
  },
};

// Customers in this region who don't read Uzbek overwhelmingly read
// Russian rather than English, so the neighbouring language codes land
// there instead of on the fallback.
const RUSSIAN_SPEAKING = ["ru", "kk", "ky", "tg", "be", "uk"];

function pickLanguage(languageCode) {
  const code = String(languageCode || "").slice(0, 2).toLowerCase();
  if (RUSSIAN_SPEAKING.includes(code)) return "ru";
  if (code === "en") return "en";
  return "uz";
}

function messagesFor(languageCode) {
  return MESSAGES[pickLanguage(languageCode)];
}

// A collected order never sees a courier, so the same status reads
// differently depending on how the food leaves the kitchen.
function statusLabelFor(order, languageCode) {
  const m = messagesFor(languageCode);
  const table = order?.orderType === "PICKUP" ? { ...m.status, ...m.pickupStatus } : m.status;
  return table[order?.status] || order?.status || "";
}

// The three buttons the bot offers on a first /start. Each label is written
// in its own language — someone who cannot read the other two still finds
// theirs.
const LANGUAGE_CHOICES = [
  { code: "uz", label: "🇺🇿 O'zbekcha" },
  { code: "ru", label: "🇷🇺 Русский" },
  { code: "en", label: "🇬🇧 English" },
];

const SUPPORTED = LANGUAGE_CHOICES.map((c) => c.code);

// A customer's own choice wins over whatever their phone happens to be set
// to; the phone is only a starting guess.
function effectiveLanguage(user) {
  if (user?.language && SUPPORTED.includes(user.language)) return user.language;
  return pickLanguage(user?.languageCode);
}

module.exports = {
  MESSAGES,
  LANGUAGE_CHOICES,
  SUPPORTED,
  pickLanguage,
  effectiveLanguage,
  messagesFor,
  statusLabelFor,
};
