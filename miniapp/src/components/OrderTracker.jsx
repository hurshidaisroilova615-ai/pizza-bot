const STEPS = [
  { key: "PENDING", label: "Qabul qilindi", icon: "✅" },
  { key: "PREPARING", label: "Tayyorlanmoqda", icon: "👨‍🍳" },
  { key: "ON_DELIVERY", label: "Kuryerda", icon: "🚚" },
  { key: "DELIVERED", label: "Yetkazildi", icon: "🎉" },
];

export default function OrderTracker({ status }) {
  if (status === "CANCELLED") {
    return <p className="order-cancelled-note">Bu buyurtma bekor qilingan ❌</p>;
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="order-tracker">
      {STEPS.map((step, i) => (
        <div key={step.key} className={`tracker-step ${i <= currentIndex ? "done" : ""}`}>
          <div className="tracker-dot">{i <= currentIndex ? step.icon : ""}</div>
          <span className="tracker-label">{step.label}</span>
          {i < STEPS.length - 1 && <div className={`tracker-line ${i < currentIndex ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}
