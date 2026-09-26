import { useEffect, useState } from "react";
import Icon from "./Icon";
import OrderStatusBadge from "./OrderStatusBadge";
import { api } from "../api";
import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n/LanguageContext";

// How often the page asks whether anything changed. A customer waiting on
// food checks the screen far more often than this; a shop on a free
// instance should not be asked more.
const REFRESH_MS = 20000;

// What a customer sees the moment their order goes through.
//
// Inside Telegram this screen is never reached: the app closes and the
// confirmation is already sitting in the chat behind it. On the shop's own
// web address there is no chat and nothing behind the page, so closing it
// would leave the customer staring at a blank tab wondering whether the
// order was placed at all. This is what stands in for that chat.
export default function OrderPlaced({ order, onBackToMenu, onSeeOrders }) {
  const settings = useSettings();
  const { t } = useI18n();

  // A customer ordering through Telegram gets a message at every step. One
  // ordering from the website has no chat to be messaged in, so the status
  // has to come to them here — otherwise the only way to find out is to
  // type their order number into a form they have to know exists.
  const [status, setStatus] = useState(order.status);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const mine = await api.getMyOrders();
        const fresh = mine.find((o) => o.id === order.id);
        if (active && fresh) setStatus(fresh.status);
      } catch {
        // offline or asleep; the next tick tries again
      }
    }
    const timer = setInterval(check, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [order.id]);

  return (
    <div className="placed">
      <div className="placed-mark">
        <Icon name="check" size={34} strokeWidth={2.4} />
      </div>

      <h1 className="placed-title">{t("placed.title")}</h1>
      <p className="placed-number">{t("placed.number", { id: order.id })}</p>

      <div className="placed-total">
        {order.totalPrice.toLocaleString()} {settings.currency}
      </div>

      <div className="placed-status">
        <OrderStatusBadge status={status} orderType={order.orderType} />
        <p className="placed-watching">{t("placed.watching")}</p>
      </div>

      <div className="placed-notes">
        {/* At a table nobody is going to phone them — the food is coming
            across the room, and which table is the one thing that matters. */}
        {order.orderType === "DINE_IN" && order.tableNumber ? (
          <p className="placed-keep">{t("placed.table", { table: order.tableNumber })}</p>
        ) : (
          <p>{t("placed.callSoon")}</p>
        )}
        {order.orderType === "PICKUP" && settings.pickupAddress && (
          <p>{t("placed.pickupWhere", { address: settings.pickupAddress })}</p>
        )}
        {order.paymentMethod === "CARD" && <p>{t("placed.cardNote")}</p>}
        {order.orderType !== "DINE_IN" && (
          <p className="placed-keep">{t("placed.saveNumber")}</p>
        )}
      </div>

      <button type="button" className="btn-primary placed-back" onClick={onBackToMenu}>
        {t("placed.backToMenu")}
      </button>

      {/* Where to look later, once they have closed this page. */}
      <button type="button" className="placed-orders" onClick={onSeeOrders}>
        {t("placed.myOrders")}
      </button>
    </div>
  );
}
