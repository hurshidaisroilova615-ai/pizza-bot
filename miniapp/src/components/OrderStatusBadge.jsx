export const STATUS_LABELS = {
  PENDING: "Qabul qilindi",
  PREPARING: "Tayyorlanmoqda",
  ON_DELIVERY: "Kuryerda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
};

const STATUS_CLASS = {
  PENDING: "status-pending",
  PREPARING: "status-preparing",
  ON_DELIVERY: "status-delivery",
  DELIVERED: "status-delivered",
  CANCELLED: "status-cancelled",
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`order-status ${STATUS_CLASS[status] || ""}`}>{STATUS_LABELS[status] || status}</span>
  );
}
