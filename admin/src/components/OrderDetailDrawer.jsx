const STATUS_OPTIONS = [
  { value: "PENDING", label: "Qabul qilindi" },
  { value: "PREPARING", label: "Tayyorlanmoqda" },
  { value: "ON_DELIVERY", label: "Kuryerda" },
  { value: "DELIVERED", label: "Yetkazildi" },
  { value: "CANCELLED", label: "Bekor qilindi" },
];

export default function OrderDetailDrawer({ order, onClose, onStatusChange }) {
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
          <h4>Mijoz</h4>
          <p>{order.user?.firstName} {order.user?.lastName || ""}</p>
          <p className="muted">{order.phone || order.user?.phone || "Telefon ko'rsatilmagan"}</p>
          <p className="muted">Telegram ID: {order.user?.telegramId}</p>
        </div>

        <div className="drawer-section">
          <h4>Yetkazish</h4>
          <p>{order.deliveryAddress || "Manzil ko'rsatilmagan"}</p>
          {order.comment && <p className="muted">Izoh: {order.comment}</p>}
        </div>

        <div className="drawer-section">
          <h4>Mahsulotlar</h4>
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
            <span>Mahsulotlar</span>
            <span>{order.subtotal.toLocaleString()}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="summary-line">
              <span>Chegirma</span>
              <span>-{order.discountAmount.toLocaleString()}</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="summary-line">
              <span>Yetkazib berish</span>
              <span>{order.deliveryFee.toLocaleString()}</span>
            </div>
          )}
          <div className="summary-line total">
            <span>Jami</span>
            <span>{order.totalPrice.toLocaleString()}</span>
          </div>
          <p className="muted">{new Date(order.createdAt).toLocaleString("uz-UZ")}</p>
        </div>

        <div className="drawer-section">
          <h4>Holatni o'zgartirish</h4>
          <select
            className="status-select"
            value={order.status}
            onChange={(e) => onStatusChange(order, e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="status-timeline">
            {order.statusHistory?.map((h) => (
              <div className="status-timeline-row" key={h.id}>
                <span>{STATUS_OPTIONS.find((o) => o.value === h.status)?.label || h.status}</span>
                <span className="muted">{new Date(h.createdAt).toLocaleString("uz-UZ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
