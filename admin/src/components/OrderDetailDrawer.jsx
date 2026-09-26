import { statusLabel, orderTypeLabel, paymentLabel } from "../lib/orderLabels";
import { useT } from "../i18n";

const STATUS_VALUES = ["PENDING", "PREPARING", "ON_DELIVERY", "DELIVERED", "CANCELLED"];

export default function OrderDetailDrawer({ order, onClose, onStatusChange }) {
  const { t } = useT();
  if (!order) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Buyurtma #{order.id}</h2>
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <h4>{t("Mijoz")}</h4>
          <p>{order.user?.firstName} {order.user?.lastName || ""}</p>
          <p className="muted">{order.phone || order.user?.phone || t("Telefon ko'rsatilmagan")}</p>
          <p className="muted">Telegram ID: {order.user?.telegramId}</p>
        </div>

        <div className="drawer-section">
          <h4>{t("Buyurtma turi")}</h4>
          <p>
            {orderTypeLabel(order.orderType, order.tableNumber)} · {paymentLabel(order.paymentMethod)}
          </p>
          {order.orderType === "PICKUP" ? (
            <p className="muted">{t("Mijoz o'zi olib ketadi")}</p>
          ) : (
            <p>{order.deliveryAddress || t("Manzil ko'rsatilmagan")}</p>
          )}
          {order.comment && <p className="muted">Izoh: {order.comment}</p>}
        </div>

        <div className="drawer-section">
          <h4>{t("Mahsulotlar")}</h4>
          <table className="drawer-table">
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>x{item.quantity}</td>
                  <td>{item.lineTotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="drawer-section">
          <div className="summary-line">
            <span>{t("Mahsulotlar")}</span>
            <span>{order.subtotal.toLocaleString()}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="summary-line">
              <span>{t("Chegirma")}</span>
              <span>-{order.discountAmount.toLocaleString()}</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="summary-line">
              <span>{t("Yetkazib berish")}</span>
              <span>{order.deliveryFee.toLocaleString()}</span>
            </div>
          )}
          <div className="summary-line total">
            <span>{t("Jami")}</span>
            <span>{order.totalPrice.toLocaleString()}</span>
          </div>
          <p className="muted">{new Date(order.createdAt).toLocaleString("uz-UZ")}</p>
        </div>

        <div className="drawer-section">
          <h4>{t("Holatni o'zgartirish")}</h4>
          <select
            className="status-select"
            value={order.status}
            onChange={(e) => onStatusChange(order, e.target.value)}
          >
            {STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value, order.orderType)}
              </option>
            ))}
          </select>

          <div className="status-timeline">
            {order.statusHistory?.map((h) => (
              <div className="status-timeline-row" key={h.id}>
                <span>{statusLabel(h.status, order.orderType)}</span>
                <span className="muted">{new Date(h.createdAt).toLocaleString("uz-UZ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
