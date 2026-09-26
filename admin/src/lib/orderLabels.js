// Mirrors backend/src/lib/orderLabels.js — the admin bundle can't import from
// the server, so the two copies must be kept in step when the wording changes.
export const STATUS_LABELS = {
  PENDING: "Qabul qilindi",
  PREPARING: "Tayyorlanmoqda",
  ON_DELIVERY: "Kuryerda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
};

const PICKUP_STATUS_LABELS = {
  ...STATUS_LABELS,
  ON_DELIVERY: "Olib ketishga tayyor",
  DELIVERED: "Topshirildi",
};

// Eating in: nothing is on its way anywhere. The food is either being
// cooked or already on the table.
const DINE_IN_STATUS_LABELS = {
  ...STATUS_LABELS,
  ON_DELIVERY: "Stolga olib borilmoqda",
  DELIVERED: "Berildi",
};

const BY_TYPE = {
  PICKUP: PICKUP_STATUS_LABELS,
  DINE_IN: DINE_IN_STATUS_LABELS,
};

// The same status reads differently depending on how the order leaves the
// kitchen — with a courier, in the customer's hand, or onto a table.
export function statusLabel(status, orderType) {
  const table = BY_TYPE[orderType] || STATUS_LABELS;
  return table[status] || status;
}

export function orderTypeLabel(orderType, tableNumber) {
  if (orderType === "PICKUP") return "🚶 Olib ketadi";
  if (orderType === "DINE_IN") {
    return tableNumber ? `🍽 Zalda · Stol ${tableNumber}` : "🍽 Zalda";
  }
  return "🛵 Yetkazish";
}

export function paymentLabel(paymentMethod) {
  return paymentMethod === "CARD" ? "💳 Karta" : "💵 Naqd";
}
