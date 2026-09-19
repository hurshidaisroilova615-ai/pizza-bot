import Icon from "./Icon";
import { useI18n } from "../i18n/LanguageContext";

const STEPS = [
  { key: "PENDING", label: "order.pending", icon: "check" },
  { key: "PREPARING", label: "order.preparing", icon: "chef" },
  { key: "ON_DELIVERY", label: "order.courier", icon: "truck" },
  { key: "DELIVERED", label: "order.delivered", icon: "bag" },
];

// A collected order has no courier, so the same four steps are worded for
// the customer who is coming to fetch it.
const PICKUP_STEPS = STEPS.map((s) =>
  s.key === "ON_DELIVERY"
    ? { ...s, label: "order.readyForPickup", icon: "walk" }
    : s.key === "DELIVERED"
    ? { ...s, label: "order.handedOver" }
    : s
);

export default function OrderTracker({ status, orderType }) {
  const { t } = useI18n();
  if (status === "CANCELLED") {
    return <p className="order-cancelled-note">{t("order.cancelledNote")}</p>;
  }

  const steps = orderType === "PICKUP" ? PICKUP_STEPS : STEPS;
  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="order-tracker">
      {steps.map((step, i) => (
        <div
          key={step.key}
          className={`tracker-step ${i <= currentIndex ? "done" : ""} ${
            i === currentIndex ? "now" : ""
          }`}
        >
          <div className="tracker-dot">
            <Icon name={step.icon} size={15} strokeWidth={2.2} />
          </div>
          <span className="tracker-label">{t(step.label)}</span>
          {i < steps.length - 1 && <div className={`tracker-line ${i < currentIndex ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}
