// Every word the Mini App says, in the three languages its customers read.
//
// What is NOT here: dish names, descriptions and category names. Those are
// the shop owner's own words, typed into the admin panel, and machine
// translating someone's menu produces nonsense on a screen they can't fix.
// They stay exactly as entered, in whatever language the owner wrote them.
export const LANGUAGES = [
  { code: "uz", label: "O'zbekcha", short: "UZ" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "en", label: "English", short: "EN" },
];

// Russian picks one of three forms by the number in front of it, and
// getting it wrong is the clearest sign to a Russian speaker that nobody
// who reads the language looked at the screen. Uzbek and English have one
// form, so they just take the first.
export const PLURALS = {
  ru: {
    "home.dishCount": ["{count} блюдо", "{count} блюда", "{count} блюд"],
    "profile.bonus": ["{points} бонусный балл", "{points} бонусных балла", "{points} бонусных баллов"],
    "cart.loyaltyPrompt": [
      "На счету {points} балл. Использовать его?",
      "На счету {points} балла. Использовать их?",
      "На счету {points} баллов. Использовать их?",
    ],
    "order.minutesAgo": ["{count} минуту назад", "{count} минуты назад", "{count} минут назад"],
  },
  en: {
    "home.dishCount": ["{count} dish", "{count} dishes", "{count} dishes"],
    "profile.bonus": ["{points} reward point", "{points} reward points", "{points} reward points"],
    "cart.loyaltyPrompt": [
      "You have {points} point. Use it?",
      "You have {points} points. Use them?",
      "You have {points} points. Use them?",
    ],
  },
};

// Slavic rule: 1, 21, 31… take the first form; 2–4, 22–24… the second;
// everything else including the teens takes the third.
export function pluralIndex(lang, n) {
  const count = Math.abs(Number(n) || 0);
  if (lang !== "ru") return count === 1 ? 0 : 1;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 0;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1;
  return 2;
}

export const messages = {
  uz: {
    "nav.home": "Bosh sahifa",
    "nav.catalog": "Katalog",
    "nav.cart": "Savatcha",
    "nav.profile": "Profil",

    "home.greeting": "Xush kelibsiz",
    "home.guest": "Mehmon",
    "home.order": "Buyurtma berish",
    "home.wholeMenu": "Butun menyu",
    "home.discountsEyebrow": "Arzonlashdi",
    "home.discounts": "Bugungi aksiyalar",
    "home.popularEyebrow": "Mijozlar tanlovi",
    "home.popular": "Ko'p buyurtma qilinadi",
    "home.all": "Barchasi",
    "home.menuEyebrow": "Menyu",
    "home.categories": "Kategoriyalar",
    "home.dishCount": "{count} ta taom",

    "story.discounts": "Aksiyalar",
    "story.new": "Yangi",
    "story.top": "Top",
    "story.bonus": "Bonus",
    "story.delivery": "Yetkazish",

    "catalog.title": "Katalog",
    "catalog.all": "Barchasi",
    "catalog.empty": "Bu kategoriyada mahsulot topilmadi",

    "product.soldOut": "Hozircha tugadi",
    "product.soldOutShort": "Tugadi",
    "product.discount": "Chegirma",
    "product.addToCart": "Savatchaga qo'shish",
    "product.extras": "Bunga mos qo'shimchalar",

    "cart.title": "Savatcha",
    "cart.empty": "Savatchangiz hozircha bo'sh.",
    "cart.emptyHint": "Katalogdan mahsulot tanlab qo'shing!",
    "cart.promo": "Promo kod",
    "cart.apply": "Qo'llash",
    "cart.promoApplied": "Promo kod qo'llandi 🎉",
    "cart.loyaltyPrompt": "Bonus balansingiz: {points} ball. Ishlatishni xohlaysizmi?",
    "cart.howLabel": "Qanday olasiz?",
    "cart.delivery": "Yetkazib berish",
    "cart.pickup": "Olib ketaman",
    "cart.paymentLabel": "To'lov turi",
    "cart.cash": "Naqd",
    "cart.card": "Karta",
    "cart.phone": "Telefon raqamingiz",
    "cart.address": "Yetkazish manzili",
    "cart.comment": "Izoh (ixtiyoriy)",
    "cart.pickupAddress": "Olib ketish manzili: {address}",
    "cart.cardLabel": "Shu kartaga o'tkazing",
    "cart.cardCopied": "Karta raqami nusxalandi",
    "cart.cardHint":
      "Pulni o'tkazib, chekni shu botga yuboring — buyurtma shundan keyin tayyorlanadi.",
    "cart.items": "Mahsulotlar",
    "cart.promoDiscount": "Promo chegirma",
    "cart.loyaltyDiscount": "Bonus ball",
    "cart.deliveryFee": "Yetkazib berish",
    "cart.total": "Jami",
    "cart.soldOutNotice": "{names} — hozircha tugadi.",
    "cart.removeSoldOut": "Savatchadan olib tashlash",
    "cart.minOrder": "Minimal buyurtma summasi: {amount} {currency}",
    "cart.closedNotice": "Hozir yopiqmiz. Ish vaqti: {open} - {close}",
    "cart.confirm": "Buyurtmani tasdiqlash",
    "cart.sending": "Yuborilmoqda...",
    "cart.closedBtn": "Hozir yopiq",
    "cart.removeSoldOutBtn": "Tugagan mahsulotni olib tashlang",

    "closed.title": "Hozir yopiqmiz",
    "closed.text": "Ish vaqti: {open} - {close}. Menyuni ko'rib turishingiz mumkin.",

    "order.live": "Buyurtmangiz #{id}",
    "order.justNow": "hozirgina",
    "order.minutesAgo": "{count} daqiqa oldin",
    "order.pending": "Qabul qilindi",
    "order.preparing": "Tayyorlanmoqda",
    "order.onTheWay": "Yo'lda",
    "order.courier": "Kuryerda",
    "order.readyForPickup": "Olib ketishga tayyor",
    "order.delivered": "Yetkazildi",
    "order.handedOver": "Topshirildi",
    "order.cancelled": "Bekor qilindi",
    "order.cancelledNote": "Bu buyurtma bekor qilingan",

    "profile.orders": "Mening buyurtmalarim",
    "profile.noOrders": "Hali buyurtmalar yo'q",
    "profile.bonus": "{points} bonus ball",
    "profile.repeat": "Yana shundan buyurtma qilish",
    "profile.language": "Til",

    "onboarding.skip": "O'tkazib yuborish",
    "onboarding.next": "Davom etish",
    "onboarding.start": "Boshladik",
    "onboarding.menuText": "Butun menyu shu yerda. Tanlang, savatchaga soling va buyurtma bering.",
    "onboarding.deliveryTitle": "Tez va oson",
    "onboarding.deliveryText":
      "Yetkazib beramiz yoki o'zingiz olib ketasiz — buyurtmangiz qaysi bosqichda ekanini shu yerda kuzatib turasiz.",
    "onboarding.bonusTitle": "Har xarid uchun bonus",
    "onboarding.bonusText":
      "To'plangan ballaringiz keyingi buyurtmangizda chegirmaga aylanadi.",
  },

  ru: {
    "nav.home": "Главная",
    "nav.catalog": "Каталог",
    "nav.cart": "Корзина",
    "nav.profile": "Профиль",

    "home.greeting": "Добро пожаловать",
    "home.guest": "Гость",
    "home.order": "Заказать",
    "home.wholeMenu": "Всё меню",
    "home.discountsEyebrow": "Снижена цена",
    "home.discounts": "Акции дня",
    "home.popularEyebrow": "Выбор гостей",
    "home.popular": "Заказывают чаще всего",
    "home.all": "Все",
    "home.menuEyebrow": "Меню",
    "home.categories": "Категории",
    "home.dishCount": "{count} блюд",

    "story.discounts": "Акции",
    "story.new": "Новое",
    "story.top": "Топ",
    "story.bonus": "Бонусы",
    "story.delivery": "Доставка",

    "catalog.title": "Каталог",
    "catalog.all": "Все",
    "catalog.empty": "В этой категории ничего нет",

    "product.soldOut": "Пока закончилось",
    "product.soldOutShort": "Нет",
    "product.discount": "Скидка",
    "product.addToCart": "В корзину",
    "product.extras": "Хорошо дополнит",

    "cart.title": "Корзина",
    "cart.empty": "Ваша корзина пока пуста.",
    "cart.emptyHint": "Выберите что-нибудь из каталога!",
    "cart.promo": "Промокод",
    "cart.apply": "Применить",
    "cart.promoApplied": "Промокод применён 🎉",
    "cart.loyaltyPrompt": "На счету {points} баллов. Использовать их?",
    "cart.howLabel": "Как вам удобнее?",
    "cart.delivery": "Доставка",
    "cart.pickup": "Заберу сам",
    "cart.paymentLabel": "Оплата",
    "cart.cash": "Наличные",
    "cart.card": "Карта",
    "cart.phone": "Ваш номер телефона",
    "cart.address": "Адрес доставки",
    "cart.comment": "Комментарий (необязательно)",
    "cart.pickupAddress": "Адрес самовывоза: {address}",
    "cart.cardLabel": "Переведите на эту карту",
    "cart.cardCopied": "Номер карты скопирован",
    "cart.cardHint":
      "Переведите сумму и отправьте чек в этот бот — после этого заказ пойдёт на кухню.",
    "cart.items": "Товары",
    "cart.promoDiscount": "Скидка по промокоду",
    "cart.loyaltyDiscount": "Бонусные баллы",
    "cart.deliveryFee": "Доставка",
    "cart.total": "Итого",
    "cart.soldOutNotice": "{names} — пока закончилось.",
    "cart.removeSoldOut": "Убрать из корзины",
    "cart.minOrder": "Минимальная сумма заказа: {amount} {currency}",
    "cart.closedNotice": "Сейчас закрыто. Работаем: {open} - {close}",
    "cart.confirm": "Подтвердить заказ",
    "cart.sending": "Отправляем...",
    "cart.closedBtn": "Сейчас закрыто",
    "cart.removeSoldOutBtn": "Уберите то, что закончилось",

    "closed.title": "Сейчас закрыто",
    "closed.text": "Работаем: {open} - {close}. Меню пока можно посмотреть.",

    "order.live": "Ваш заказ #{id}",
    "order.justNow": "только что",
    "order.minutesAgo": "{count} мин назад",
    "order.pending": "Принят",
    "order.preparing": "Готовится",
    "order.onTheWay": "В пути",
    "order.courier": "У курьера",
    "order.readyForPickup": "Готов к выдаче",
    "order.delivered": "Доставлен",
    "order.handedOver": "Выдан",
    "order.cancelled": "Отменён",
    "order.cancelledNote": "Этот заказ отменён",

    "profile.orders": "Мои заказы",
    "profile.noOrders": "Заказов пока нет",
    "profile.bonus": "{points} бонусных баллов",
    "profile.repeat": "Повторить заказ",
    "profile.language": "Язык",

    "onboarding.skip": "Пропустить",
    "onboarding.next": "Далее",
    "onboarding.start": "Начнём",
    "onboarding.menuText": "Всё меню здесь. Выбирайте, кладите в корзину и заказывайте.",
    "onboarding.deliveryTitle": "Быстро и просто",
    "onboarding.deliveryText":
      "Привезём или заберёте сами — а на какой стадии заказ, видно прямо здесь.",
    "onboarding.bonusTitle": "Баллы за каждый заказ",
    "onboarding.bonusText": "Накопленные баллы станут скидкой на следующий заказ.",
  },

  en: {
    "nav.home": "Home",
    "nav.catalog": "Menu",
    "nav.cart": "Cart",
    "nav.profile": "Profile",

    "home.greeting": "Welcome",
    "home.guest": "Guest",
    "home.order": "Order now",
    "home.wholeMenu": "Full menu",
    "home.discountsEyebrow": "Price drop",
    "home.discounts": "Today's deals",
    "home.popularEyebrow": "Guests' choice",
    "home.popular": "Most ordered",
    "home.all": "See all",
    "home.menuEyebrow": "Menu",
    "home.categories": "Categories",
    "home.dishCount": "{count} dishes",

    "story.discounts": "Deals",
    "story.new": "New",
    "story.top": "Top",
    "story.bonus": "Rewards",
    "story.delivery": "Delivery",

    "catalog.title": "Menu",
    "catalog.all": "All",
    "catalog.empty": "Nothing in this category yet",

    "product.soldOut": "Sold out for now",
    "product.soldOutShort": "Sold out",
    "product.discount": "Deal",
    "product.addToCart": "Add to cart",
    "product.extras": "Goes well with",

    "cart.title": "Cart",
    "cart.empty": "Your cart is empty.",
    "cart.emptyHint": "Pick something from the menu!",
    "cart.promo": "Promo code",
    "cart.apply": "Apply",
    "cart.promoApplied": "Promo code applied 🎉",
    "cart.loyaltyPrompt": "You have {points} points. Use them?",
    "cart.howLabel": "How would you like it?",
    "cart.delivery": "Delivery",
    "cart.pickup": "I'll collect it",
    "cart.paymentLabel": "Payment",
    "cart.cash": "Cash",
    "cart.card": "Card",
    "cart.phone": "Your phone number",
    "cart.address": "Delivery address",
    "cart.comment": "Note (optional)",
    "cart.pickupAddress": "Collection address: {address}",
    "cart.cardLabel": "Transfer to this card",
    "cart.cardCopied": "Card number copied",
    "cart.cardHint":
      "Transfer the amount and send the receipt to this bot — the kitchen starts once it arrives.",
    "cart.items": "Items",
    "cart.promoDiscount": "Promo discount",
    "cart.loyaltyDiscount": "Reward points",
    "cart.deliveryFee": "Delivery",
    "cart.total": "Total",
    "cart.soldOutNotice": "{names} — sold out for now.",
    "cart.removeSoldOut": "Remove from cart",
    "cart.minOrder": "Minimum order: {amount} {currency}",
    "cart.closedNotice": "We're closed. Open {open} - {close}",
    "cart.confirm": "Place order",
    "cart.sending": "Sending...",
    "cart.closedBtn": "Closed right now",
    "cart.removeSoldOutBtn": "Remove the sold-out item",

    "closed.title": "We're closed right now",
    "closed.text": "Open {open} - {close}. You can still browse the menu.",

    "order.live": "Your order #{id}",
    "order.justNow": "just now",
    "order.minutesAgo": "{count} min ago",
    "order.pending": "Accepted",
    "order.preparing": "Being cooked",
    "order.onTheWay": "On the way",
    "order.courier": "With the courier",
    "order.readyForPickup": "Ready to collect",
    "order.delivered": "Delivered",
    "order.handedOver": "Collected",
    "order.cancelled": "Cancelled",
    "order.cancelledNote": "This order was cancelled",

    "profile.orders": "My orders",
    "profile.noOrders": "No orders yet",
    "profile.bonus": "{points} reward points",
    "profile.repeat": "Order this again",
    "profile.language": "Language",

    "onboarding.skip": "Skip",
    "onboarding.next": "Next",
    "onboarding.start": "Let's go",
    "onboarding.menuText": "The whole menu is here. Pick, add to cart, order.",
    "onboarding.deliveryTitle": "Quick and simple",
    "onboarding.deliveryText":
      "We'll bring it, or you collect it — and you can watch where your order is from here.",
    "onboarding.bonusTitle": "Points on every order",
    "onboarding.bonusText": "The points you collect become a discount on your next order.",
  },
};
