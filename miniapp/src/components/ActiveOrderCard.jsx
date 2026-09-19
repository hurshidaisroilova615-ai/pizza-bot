import { useEffect, useState } from "react";
import Icon from "./Icon";
import { api } from "../api";

// Four states the kitchen moves an order through. Collection never sees a
// courier, so the third step is worded for whoever is actually carrying the
// food.
const STEPS = [
  { key: "PENDING", icon: "check", label: "Qabul qilindi" },
  { key: "PREPARING", icon: "chef", label: "Tayyorlanmoqda" },
  { key: "ON_DELIVERY", icon: "truck", label: "Yo'lda" },
  { key: "DELIVERED", icon: "bag", label: "Yetkazildi" },
];

const PICKUP_STEPS = STEPS.map((s) =>
  s.key === "ON_DELIVERY"
    ? { ...s, icon: "walk", label: "Olib ketishga tayyor" }
    : s.key === "DELIVERED"
    ? { ...s, label: "Topshirildi" }
    : s
);

const LIVE = ["PENDING", "PREPARING", "ON_DELIVERY"];

function minutesSince(iso) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

// The card most customers will never think about, and the one that makes the
// difference: after ordering they keep the Mini App open watching this
// instead of messaging the shop to ask whether the food is coming.
export default function ActiveOrderCard({ refreshKey, onOpenProfile }) {
  const [order, setOrder] = useState(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    let active = true;
    function load() {
      api
        .getMyOrders()
        .then((orders) => {
          if (!active) return;
          setOrder(orders.find((o) => LIVE.includes(o.status)) || null);
        })
        .catch(() => active && setOrder(null));
    }
    load();
    // The owner advances the order from the admin panel; without polling the
    // customer would sit on a stale "Qabul qilindi" until they reopened it.
    const poll = setInterval(load, 15000);
    // Re-renders the "N daqiqa oldin" line between polls.
    const tick = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [refreshKey]);

  if (!order) return null;

  const steps = order.orderType === "PICKUP" ? PICKUP_STEPS : STEPS;
  const current = steps.findIndex((s) => s.key === order.status);
  const progress = ((current + 0.5) / steps.length) * 100;
  const waited = minutesSince(order.createdAt);

  return (
    <button className="active-order" onClick={onOpenProfile}>
      <div className="active-order-head">
        <span className="active-order-pulse" />
        <span className="active-order-title">Buyurtmangiz #{order.id}</span>
        <span className="active-order-time">
          {waited < 1 ? "hozirgina" : `${waited} daqiqa oldin`}
        </span>
      </div>

      <p className="active-order-status">{steps[current]?.label}</p>

      <div className="active-order-track">
        <div className="active-order-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="active-order-steps">
        {steps.map((step, i) => (
          <span
            key={step.key}
            className={`active-order-step ${i < current ? "done" : ""} ${i === current ? "now" : ""}`}
          >
            <Icon name={step.icon} size={16} strokeWidth={2} />
          </span>
        ))}
      </div>
    </button>
  );
}
