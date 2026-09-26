import { useEffect, useState } from "react";
import { api } from "../api";
import OrderDetailDrawer from "../components/OrderDetailDrawer";
import { STATUS_LABELS, statusLabel, orderTypeLabel, paymentLabel } from "../lib/orderLabels";
import { useT } from "../i18n";

const STATUS_FILTERS = ["", "PENDING", "PREPARING", "ON_DELIVERY", "DELIVERED", "CANCELLED"];

// An order walks one way through the kitchen, so the list offers the single
// next step as a button. Advancing an order is the job the owner does
// dozens of times a day; it shouldn't require opening a panel to find it.
const NEXT_STATUS = {
  PENDING: "PREPARING",
  PREPARING: "ON_DELIVERY",
  ON_DELIVERY: "DELIVERED",
};

export default function Orders() {
  const { t } = useT();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);

  function load() {
    setLoading(true);
    api
      .getOrders(statusFilter)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  async function handleStatusChange(order, status) {
    try {
      const updated = await api.updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      // Refresh the detail panel only when it is already showing this order;
      // advancing from the list shouldn't pop a panel open over the list.
      setSelected((current) => (current && current.id === updated.id ? updated : current));
    } catch (err) {
      // Without this the dropdown silently snapped back and the customer
      // never got their notification, with nothing on screen to explain it.
      alert(t("Holatni o'zgartirib bo'lmadi: {message}", { message: err.message }));
      load();
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t("Buyurtmalar")}</h1>
        <button className="btn btn-outline" onClick={load}>
          {t("Yangilash")}
        </button>
      </div>

      <div className="filter-bar">
        <span className="filter-label">{t("Saralash")}</span>
        <div className="tag-row-admin">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || "all"}
              className={`tag-admin ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s ? t(STATUS_LABELS[s]) : t("Barchasi")}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="empty-note">{t("Yuklanmoqda...")}</p>}
      {!loading && orders.length === 0 && <p className="empty-note">{t("Hozircha buyurtmalar yo'q")}</p>}

      {orders.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t("Mijoz")}</th>
                <th>{t("Telefon")}</th>
                <th>{t("Turi")}</th>
                <th>{t("Mahsulotlar")}</th>
                <th>{t("Jami")}</th>
                <th>{t("Sana")}</th>
                <th>{t("Holati")}</th>
                <th>{t("Keyingi qadam")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="clickable-row" onClick={() => setSelected(order)}>
                  <td data-label="#">#{order.id}</td>
                  <td data-label={t("Mijoz")}>{order.user?.firstName || "—"}</td>
                  <td data-label={t("Telefon")}>{order.phone || order.user?.phone || "—"}</td>
                  <td data-label={t("Turi")} className="nowrap-cell">
                    {orderTypeLabel(order.orderType, order.tableNumber, t)}
                    <br />
                    <span className="muted">{paymentLabel(order.paymentMethod, t)}</span>
                  </td>
                  <td data-label={t("Mahsulotlar")} className="truncate-cell">
                    {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                  </td>
                  <td data-label={t("Jami")}>{order.totalPrice.toLocaleString()}</td>
                  <td data-label={t("Sana")}>{new Date(order.createdAt).toLocaleString("uz-UZ")}</td>
                  <td data-label={t("Holati")}>
                    <span className={`status-pill status-${order.status.toLowerCase()}`}>
                      {statusLabel(order.status, order.orderType, t)}
                    </span>
                  </td>
                  <td data-label={t("Keyingi qadam")} className="row-actions">
                    {NEXT_STATUS[order.status] ? (
                      <button
                        className="btn btn-accent advance-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(order, NEXT_STATUS[order.status]);
                        }}
                      >
                        {statusLabel(NEXT_STATUS[order.status], order.orderType, t)} →
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OrderDetailDrawer order={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
    </div>
  );
}
