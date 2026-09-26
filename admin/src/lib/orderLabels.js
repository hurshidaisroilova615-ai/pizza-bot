// Mirrors backend/src/lib/orderLabels.js — the admin bundle can't import from
// the server, so the two copies must be kept in step when the wording changes.
//
// Each function takes the panel's translator, because these strings are
// assembled here rather than written out in the JSX: a status is picked
// from a table and a table number is glued onto the end, so there is no
// finished sentence for the usual lookup to find. Without it the orders
// list stays Uzbek however the panel is set — which is exactly what
// happened.
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

const same = (s) => s;

// The same status reads differently depending on how the order leaves the
// kitchen — with a courier, in the customer's hand, or onto a table.
export function statusLabel(status, orderType, t = same) {
  const table = BY_TYPE[orderType] || STATUS_LABELS;
  return t(table[status] || status);
}

export function orderTypeLabel(orderType, tableNumber, t = same) {
  if (orderType === "PICKUP") return `🚶 ${t("Olib ketadi")}`;
  if (orderType === "DINE_IN") {
    return tableNumber ? `🍽 ${t("Zalda")} · ${t("Stol")} ${tableNumber}` : `🍽 ${t("Zalda")}`;
  }
  return `🛵 ${t("Yetkazish")}`;
}

export function paymentLabel(paymentMethod, t = same) {
  return paymentMethod === "CARD" ? `💳 ${t("Karta")}` : `💵 ${t("Naqd")}`;
}
