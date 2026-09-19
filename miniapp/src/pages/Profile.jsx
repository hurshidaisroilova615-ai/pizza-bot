import { useEffect, useState } from "react";
import { api } from "../api";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import OrderStatusBadge from "../components/OrderStatusBadge";
import OrderTracker from "../components/OrderTracker";
import Icon from "../components/Icon";

export default function Profile({ telegramUser, onNavigateCatalog, refreshKey }) {
  const settings = useSettings();
  const [orders, setOrders] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api.getMyOrders(), api.getLoyalty().catch(() => null)])
      .then(([ordersData, loyaltyData]) => {
        if (!active) return;
        setOrders(ordersData);
        setLoyalty(loyaltyData);
      })
      .catch(() => active && setOrders([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [telegramUser.telegramId, refreshKey]);

  function repeatOrder(order) {
    order.items.forEach((item) => {
      if (!item.productId) return;
      addItem(
        { id: item.productId, name: item.name, imageUrl: item.imageUrl, price: item.price },
        item.quantity
      );
    });
    onNavigateCatalog();
  }

  return (
    <div>
      <div className="profile-header">
        <div className="profile-avatar">
          <Icon name="user" size={30} strokeWidth={1.6} />
        </div>
        <h1 className="profile-name">{telegramUser.firstName}</h1>
        {settings.loyaltyEnabled && (
          <div className="loyalty-badge">
            <Icon name="gift" size={15} strokeWidth={2} />
            {loyalty?.balance ?? 0} bonus ball
          </div>
        )}
      </div>

      <h2 className="section-title">Mening buyurtmalarim</h2>

      {loading && (
        <div className="order-skeletons">
          {[0, 1].map((i) => (
            <div className="order-history-item" key={i}>
              <div className="skeleton skeleton-line" style={{ width: "40%" }} />
              <div className="skeleton skeleton-line" style={{ width: "75%", marginTop: 12 }} />
              <div className="skeleton skeleton-line short" style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-emoji">
            <Icon name="bag" size={30} strokeWidth={1.5} />
          </div>
          <p>Hali buyurtmalar yo'q</p>
        </div>
      )}

      {orders.map((order) => {
        const expanded = expandedId === order.id;
        return (
          <div className="order-history-item" key={order.id}>
            <div
              className="order-history-top"
              onClick={() => setExpandedId(expanded ? null : order.id)}
              role="button"
            >
              <OrderStatusBadge status={order.status} />
              <span className="order-date">{new Date(order.createdAt).toLocaleDateString("uz-UZ")}</span>
            </div>

            {expanded && <OrderTracker status={order.status} orderType={order.orderType} />}

            <p className="order-items-text">{order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}</p>
            <div className="order-total">
              {order.totalPrice.toLocaleString()} {settings.currency}
            </div>
            <button className="repeat-btn" onClick={() => repeatOrder(order)}>
              Yana shundan buyurtma qilish
            </button>
          </div>
        );
      })}
    </div>
  );
}
