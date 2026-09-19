import { useState } from "react";
import { useSave } from "../lib/useSave";
import { api } from "../api";

export default function CustomerDetailDrawer({ customer, onClose, onAdjusted }) {
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const { saving, error, save } = useSave();

  if (!customer) return null;

  async function handleAdjust() {
    if (!points) return;
    const { ok } = await save(async () => {
      await api.adjustLoyalty(customer.id, Number(points), note || undefined);
    });
    if (!ok) return;
    setPoints("");
    setNote("");
    onAdjusted();
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>
            {customer.firstName} {customer.lastName || ""}
          </h2>
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <h4>Ma'lumotlar</h4>
          <p className="muted">Telegram ID: {customer.telegramId}</p>
          <p className="muted">Username: {customer.username ? `@${customer.username}` : "—"}</p>
          <p className="muted">Telefon: {customer.phone || "—"}</p>
          <p className="muted">Ro'yxatdan o'tgan: {new Date(customer.createdAt).toLocaleDateString("uz-UZ")}</p>
        </div>

        <div className="stat-grid stat-grid-3">
          <div className="stat-card">
            <span className="stat-label">Buyurtmalar</span>
            <span className="stat-value">{customer.ordersCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Jami xarid</span>
            <span className="stat-value">{customer.totalSpent.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Bonus ball</span>
            <span className="stat-value">{customer.loyaltyPoints}</span>
          </div>
        </div>

        <div className="drawer-section">
          <h4>Eng ko'p buyurtma qilingan mahsulotlar</h4>
          {(customer.favoriteProducts || []).length === 0 && <p className="muted">Ma'lumot yo'q</p>}
          {(customer.favoriteProducts || []).map((p) => (
            <div className="status-timeline-row" key={p.name}>
              <span>{p.name}</span>
              <span className="muted">{p.quantity} marta</span>
            </div>
          ))}
        </div>

        <div className="drawer-section">
          <h4>Bonus balansni to'g'rilash</h4>
          <div className="form-row">
            <input
              type="number"
              placeholder="+50 yoki -20"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
            <input placeholder="Izoh" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn btn-accent" onClick={handleAdjust} disabled={saving || !points}>
              {saving ? "Saqlanmoqda..." : "Qo'llash"}
            </button>
          </div>
          {error && <p className="form-error save-error">{error}</p>}
        </div>

        <div className="drawer-section">
          <h4>Buyurtmalar tarixi</h4>
          {customer.orders.map((o) => (
            <div className="status-timeline-row" key={o.id}>
              <span>
                #{o.id} — {o.items.map((i) => i.name).join(", ")}
              </span>
              <span className="muted">{o.totalPrice.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
