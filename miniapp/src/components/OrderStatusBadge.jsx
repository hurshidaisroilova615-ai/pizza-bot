import { useI18n } from "../i18n/LanguageContext";

const STATUS_KEYS = {
  PENDING: "order.pending",
  PREPARING: "order.preparing",
  ON_DELIVERY: "order.courier",
  DELIVERED: "order.delivered",
  CANCELLED: "order.cancelled",
};

// A collected order never saw a courier, so the same status is worded for
// whoever actually carried the food.
const PICKUP_KEYS = {
  ...STATUS_KEYS,
  ON_DELIVERY: "order.readyForPickup",
  DELIVERED: "order.handedOver",
};

const STATUS_CLASS = {
  PENDING: "status-pending",
  PREPARING: "status-preparing",
  ON_DELIVERY: "status-delivery",
  DELIVERED: "status-delivered",
  CANCELLED: "status-cancelled",
};

export default function OrderStatusBadge({ status, orderType }) {
  const { t } = useI18n();
  const keys = orderType === "PICKUP" ? PICKUP_KEYS : STATUS_KEYS;
  return (
    <span className={`order-status ${STATUS_CLASS[status] || ""}`}>
      {keys[status] ? t(keys[status]) : status}
    </span>
  );
}
