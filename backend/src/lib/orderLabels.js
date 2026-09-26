// A pickup order never sees a courier, so the shared status names read wrong
// for it ("Kuryerda" when the customer is the one collecting). These helpers
// keep one status enum but two sets of words, and are used by both the bot's
// customer notifications and the owner alerts.
const STATUS_LABELS = {
  PENDING: "Qabul qilindi ✅",
  PREPARING: "Tayyorlanmoqda 👨‍🍳",
  ON_DELIVERY: "Kuryerda 🚚",
  DELIVERED: "Yetkazildi 🎉",
  CANCELLED: "Bekor qilindi ❌",
};

const PICKUP_STATUS_LABELS = {
  ...STATUS_LABELS,
  ON_DELIVERY: "Tayyor, olib ketishingiz mumkin 🛍",
  DELIVERED: "Topshirildi 🎉",
};

// Eating in: the customer is sitting a few metres from the kitchen, so
// nothing is on its way anywhere — it is either being cooked or on the
// table in front of them.
const DINE_IN_STATUS_LABELS = {
  ...STATUS_LABELS,
  ON_DELIVERY: "Tayyor, olib kelinmoqda 🍽",
  DELIVERED: "Yoqimli ishtaha 🎉",
};

const BY_TYPE = {
  PICKUP: PICKUP_STATUS_LABELS,
  DINE_IN: DINE_IN_STATUS_LABELS,
};

function statusLabel(order) {
  const table = BY_TYPE[order?.orderType] || STATUS_LABELS;
  return table[order?.status] || order?.status || "";
}

function orderTypeLabel(orderType, tableNumber) {
  if (orderType === "PICKUP") return "🚶 Olib ketadi";
  if (orderType === "DINE_IN") {
    return tableNumber ? `🍽 Zalda · Stol ${tableNumber}` : "🍽 Zalda";
  }
  return "🛵 Yetkazib berish";
}

function paymentLabel(paymentMethod) {
  return paymentMethod === "CARD" ? "💳 Karta" : "💵 Naqd";
}

module.exports = {
  STATUS_LABELS,
  PICKUP_STATUS_LABELS,
  DINE_IN_STATUS_LABELS,
  statusLabel,
  orderTypeLabel,
  paymentLabel,
};
