// What the shop's owner is sent when an order arrives.
//
// This is the one message a cafe reads every working day, often on a phone
// held in one hand behind a counter. It is also the message that decides
// whether a Kyrgyz owner can use the shop at all — their customers pick
// their own language in the app, but nobody was picking theirs.
//
// Kept apart from the customer's wording (lib/botMessages.js) on purpose:
// an alert is read by somebody who already knows what their own shop sells
// and wants the four facts they act on — who, how it goes out, how it is
// paid, how much.
const WORDS = {
  uz: {
    newOrder: (id) => `🆕 Yangi buyurtma #${id}`,
    customer: "Mijoz",
    address: "Manzil",
    phone: "Telefon",
    total: "Jami",
    comment: "Izoh",
    cardWarning: "⚠️ Karta to'lovi — tushganini tekshiring",
    delivery: "🛵 Yetkazib berish",
    pickup: "🚶 Olib ketadi",
    dineIn: (table) => (table ? `🍽 Zalda · Stol ${table}` : "🍽 Zalda"),
    cash: "💵 Naqd",
    card: "💳 Karta",
  },
  ru: {
    newOrder: (id) => `🆕 Новый заказ #${id}`,
    customer: "Клиент",
    address: "Адрес",
    phone: "Телефон",
    total: "Итого",
    comment: "Комментарий",
    cardWarning: "⚠️ Оплата картой — проверьте поступление",
    delivery: "🛵 Доставка",
    pickup: "🚶 Самовывоз",
    dineIn: (table) => (table ? `🍽 В зале · Столик ${table}` : "🍽 В зале"),
    cash: "💵 Наличные",
    card: "💳 Карта",
  },
};

const SUPPORTED = Object.keys(WORDS);

function wordsFor(language) {
  return WORDS[SUPPORTED.includes(language) ? language : "uz"];
}

function howItGoesOut(order, w) {
  if (order.orderType === "PICKUP") return w.pickup;
  if (order.orderType === "DINE_IN") return w.dineIn(order.tableNumber);
  return w.delivery;
}

// Built as lines rather than a sentence: the kitchen scans it, never reads
// it, and a line that does not apply is left out entirely instead of
// standing there empty.
function ownerAlert(order, customerName, language) {
  const w = wordsFor(language);
  return [
    w.newOrder(order.id),
    `${w.customer}: ${customerName}`,
    `${howItGoesOut(order, w)} · ${order.paymentMethod === "CARD" ? w.card : w.cash}`,
    order.paymentMethod === "CARD" ? w.cardWarning : null,
    order.deliveryAddress ? `${w.address}: ${order.deliveryAddress}` : null,
    order.phone ? `${w.phone}: ${order.phone}` : null,
    order.comment ? `${w.comment}: ${order.comment}` : null,
    `${w.total}: ${order.totalPrice.toLocaleString()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

module.exports = { ownerAlert, wordsFor, SUPPORTED };
