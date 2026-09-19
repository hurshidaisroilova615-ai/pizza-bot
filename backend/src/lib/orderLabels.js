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

function statusLabel(order) {
  const table = order?.orderType === "PICKUP" ? PICKUP_STATUS_LABELS : STATUS_LABELS;
  return table[order?.status] || order?.status || "";
}

function orderTypeLabel(orderType) {
  return orderType === "PICKUP" ? "🚶 Olib ketadi" : "🛵 Yetkazib berish";
}

function paymentLabel(paymentMethod) {
  return paymentMethod === "CARD" ? "💳 Karta" : "💵 Naqd";
}

module.exports = { STATUS_LABELS, PICKUP_STATUS_LABELS, statusLabel, orderTypeLabel, paymentLabel };
