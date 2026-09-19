import Icon from "./Icon";

const STEPS = [
  { key: "PENDING", label: "Qabul qilindi", icon: "check" },
  { key: "PREPARING", label: "Tayyorlanmoqda", icon: "chef" },
  { key: "ON_DELIVERY", label: "Kuryerda", icon: "truck" },
  { key: "DELIVERED", label: "Yetkazildi", icon: "bag" },
];

// A collected order has no courier, so the same four steps are worded for
// the customer who is coming to fetch it.
const PICKUP_STEPS = STEPS.map((s) =>
  s.key === "ON_DELIVERY"
    ? { ...s, label: "Olib ketishga tayyor", icon: "walk" }
    : s.key === "DELIVERED"
    ? { ...s, label: "Topshirildi" }
    : s
);

export default function OrderTracker({ status, orderType }) {
  if (status === "CANCELLED") {
    return <p className="order-cancelled-note">Bu buyurtma bekor qilingan</p>;
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
          <span className="tracker-label">{step.label}</span>
          {i < steps.length - 1 && <div className={`tracker-line ${i < currentIndex ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}
