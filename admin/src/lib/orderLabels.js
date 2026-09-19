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

// A pickup order never sees a courier, so the same status reads differently
// depending on how the order leaves the kitchen.
export function statusLabel(status, orderType) {
  const table = orderType === "PICKUP" ? PICKUP_STATUS_LABELS : STATUS_LABELS;
  return table[status] || status;
}

export function orderTypeLabel(orderType) {
  return orderType === "PICKUP" ? "🚶 Olib ketadi" : "🛵 Yetkazish";
}

export function paymentLabel(paymentMethod) {
  return paymentMethod === "CARD" ? "💳 Karta" : "💵 Naqd";
}
