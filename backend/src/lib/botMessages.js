// What the bot says, in the four languages its customers read.
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
    chooseLanguage: "Tilni tanlang / Тил тандаңыз / Выберите язык / Choose your language",
    languageSet: "Til o'zbekchaga o'zgartirildi.",
    languageCommand: "Tilni o'zgartirish uchun /til deb yozing.",
    noOrders: "Sizda hali buyurtmalar yo'q.",
    chatIdInfo: (chatId) => `Sizning Telegram ID raqamingiz:\n\n${chatId}\n\nYangi buyurtma xabarlarini olish uchun shu raqamni admin panel → Sozlamalar bo'limiga qo'ying.`,
    help: "/start — Mini App'ni ochish\n/orders — Oxirgi buyurtmalaringiz\n/til — Tilni o'zgartirish\n/id — Telegram ID raqamingiz\n/help — Yordam",
    orderCreated: (id, total) =>
      `Buyurtmangiz #${id} qabul qilindi! ✅\nJami: ${total}\n\nHolatini shu botdan yoki Mini App profilingizdan kuzatib borishingiz mumkin.`,
    pickupCollect: (id) => `Kelganingizda kassada #${id} raqamini ayting.`,
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
    chooseLanguage: "Tilni tanlang / Тил тандаңыз / Выберите язык / Choose your language",
    languageSet: "Язык переключён на русский.",
    languageCommand: "Чтобы сменить язык, отправьте /til.",
    noOrders: "У вас пока нет заказов.",
    chatIdInfo: (chatId) => `Ваш Telegram ID:\n\n${chatId}\n\nЧтобы получать уведомления о новых заказах, впишите этот номер в админ-панели → Настройки.`,
    help: "/start — открыть приложение\n/orders — ваши последние заказы\n/til — сменить язык\n/id — ваш Telegram ID\n/help — помощь",
    orderCreated: (id, total) =>
      `Заказ #${id} принят! ✅\nИтого: ${total}\n\nСледить за ним можно здесь или в профиле в приложении.`,
    pickupCollect: (id) => `Назовите номер #${id} на кассе, когда придёте.`,
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
  ky: {
    greeting: "Саламатсызбы! 👋",
    welcome: (name) => `«${name}» — кош келиңиз!`,
    orderPrompt: "Заказ берүү үчүн төмөнкү баскычты басыңыз.",
    orderButton: "🛍 Заказ берүү",
    menuButton: "Меню",
    chooseLanguage: "Tilni tanlang / Тил тандаңыз / Выберите язык / Choose your language",
    languageSet: "Тил кыргызчага которулду.",
    languageCommand: "Тилди өзгөртүү үчүн /til деп жазыңыз.",
    noOrders: "Сизде азырынча заказдар жок.",
    chatIdInfo: (chatId) => `Сиздин Telegram ID:\n\n${chatId}\n\nЖаңы заказдар жөнүндө кабар алуу үчүн бул номерди админ панелдеги → Жөндөөлөр бөлүмүнө жазыңыз.`,
    help: "/start — тиркемени ачуу\n/orders — акыркы заказдарыңыз\n/til — тилди өзгөртүү\n/id — Telegram ID\n/help — жардам",
    orderCreated: (id, total) =>
      `Заказыңыз #${id} кабыл алынды! ✅\nЖалпы: ${total}\n\nАбалын ушул боттон же тиркемедеги профилиңизден көзөмөлдөй аласыз.`,
    pickupCollect: (id) => `Келгениңизде кассада #${id} номерин айтыңыз.`,
    statusChanged: (id, label) => `Заказыңыздын #${id} абалы жаңырды:\n${label}`,
    total: "Жалпы",
    status: {
      PENDING: "Кабыл алынды ✅",
      PREPARING: "Даярдалууда 👨‍🍳",
      ON_DELIVERY: "Курьерде 🚚",
      DELIVERED: "Жеткирилди 🎉",
      CANCELLED: "Жокко чыгарылды ❌",
    },
    pickupStatus: {
      ON_DELIVERY: "Даяр, алып кетсеңиз болот 🛍",
      DELIVERED: "Тапшырылды 🎉",
    },
  },
  en: {
    greeting: "Hello! 👋",
    welcome: (name) => `Welcome to ${name}.`,
    orderPrompt: "Tap the button below to order.",
    orderButton: "🛍 Order now",
    menuButton: "Menu",
    chooseLanguage: "Tilni tanlang / Тил тандаңыз / Выберите язык / Choose your language",
    languageSet: "Language switched to English.",
    languageCommand: "Send /til to change the language.",
    noOrders: "You have no orders yet.",
    chatIdInfo: (chatId) => `Your Telegram ID:\n\n${chatId}\n\nPut this number into the admin panel → Settings to get a message on every new order.`,
    help: "/start — open the app\n/orders — your recent orders\n/til — change language\n/id — your Telegram ID\n/help — help",
    orderCreated: (id, total) =>
      `Order #${id} accepted! ✅\nTotal: ${total}\n\nYou can follow it here or in your profile in the app.`,
    pickupCollect: (id) => `Give the number #${id} at the counter when you arrive.`,
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
// there instead of on the fallback. Kyrgyz has its own table now, so it
// is no longer among them.
const RUSSIAN_SPEAKING = ["ru", "kk", "tg", "be", "uk"];

function pickLanguage(languageCode) {
  const code = String(languageCode || "").slice(0, 2).toLowerCase();
  if (code === "ky") return "ky";
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

// The buttons the bot offers on a first /start. Each label is written in
// its own language — someone who cannot read the others still finds theirs.
const LANGUAGE_CHOICES = [
  { code: "uz", label: "🇺🇿 O'zbekcha" },
  { code: "ky", label: "🇰🇬 Кыргызча" },
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
