import { useState } from "react";
import { api } from "../api";
import Icon from "./Icon";
import OrderStatusBadge from "./OrderStatusBadge";
import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n/LanguageContext";
import { savedContact } from "../identity";

// Finding an order again from a different device.
//
// A browser remembers its own orders, but only that browser: order from a
// phone at lunch, check from a laptop in the evening, and the history is
// empty. Telegram never has this problem because the account travels with
// the person. Here the order number plus the phone it was placed with do
// the same job — both are needed, so neither one leaks the other's orders.
export default function TrackOrder() {
  const settings = useSettings();
  const { t } = useI18n();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState(savedContact().phone || "");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  async function find(e) {
    e.preventDefault();
    setSearching(true);
    setError("");
    setOrder(null);
    try {
      setOrder(await api.trackOrder(Number(orderId.replace(/\D/g, "")), phone));
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="track">
      <h2 className="section-title">{t("track.title")}</h2>
      <p className="track-hint">{t("track.hint")}</p>

      <form className="track-form" onSubmit={find}>
        <input
          className="location-input"
          inputMode="numeric"
          placeholder={t("track.orderNumber")}
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <input
          className="location-input"
          inputMode="tel"
          placeholder={t("track.phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={searching || !orderId.trim() || !phone.trim()}
        >
          {searching ? t("track.searching") : t("track.find")}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {order && (
        <div className="track-result">
          <div className="track-result-head">
            <span className="track-result-id">#{order.id}</span>
            <OrderStatusBadge status={order.status} orderType={order.orderType} />
          </div>
          <p className="track-result-when">
            {t("track.placedAt", { when: new Date(order.createdAt).toLocaleString() })}
          </p>
          <ul className="track-result-items">
            {order.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>
                  {item.lineTotal.toLocaleString()} {settings.currency}
                </span>
              </li>
            ))}
          </ul>
          <div className="track-result-total">
            <span>
              <Icon name="cart" size={15} strokeWidth={2} />
            </span>
            <span>
              {order.totalPrice.toLocaleString()} {settings.currency}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
