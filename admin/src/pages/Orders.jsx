import { useEffect, useState } from "react";
import { api } from "../api";
import OrderDetailDrawer from "../components/OrderDetailDrawer";
import { STATUS_LABELS, statusLabel, orderTypeLabel, paymentLabel } from "../lib/orderLabels";
import { useT } from "../i18n";

const STATUS_FILTERS = ["", "PENDING", "PREPARING", "ON_DELIVERY", "DELIVERED", "CANCELLED"];

// A room order, a collection and a delivery are three different jobs done
// by three different people, and reading them off one mixed list is where
// a table gets forgotten. Each gets its own tab, with how many are in it.
const TYPE_TABS = [
  { value: "", label: "Barchasi" },
  { value: "DINE_IN", label: "Zalda" },
  { value: "PICKUP", label: "Olib ketadi" },
  { value: "DELIVERY", label: "Yetkazish" },
];

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
  const [typeFilter, setTypeFilter] = useState("");
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

      // Handing the food over is the moment the cash changes hands, and it
      // is the only moment anybody remembers it. Asked here it is one tap;
      // asked later it is an order nobody can account for.
      if (status === "DELIVERED" && !updated.isPaid && updated.paymentMethod === "CASH") {
        if (confirm(t("Pul olindimi?"))) await handleTogglePaid(updated, true);
      }
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

  async function handleTogglePaid(order, isPaid) {
    try {
      const updated = await api.markOrderPaid(order.id, isPaid);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelected((current) => (current && current.id === updated.id ? updated : current));
    } catch (err) {
      alert(t("O'zgartirib bo'lmadi: {message}", { message: err.message }));
      load();
    }
  }

  const shown = typeFilter ? orders.filter((o) => o.orderType === typeFilter) : orders;

  return (
    <div>
      <div className="page-header">
        <h1>{t("Buyurtmalar")}</h1>
        <button className="btn btn-outline" onClick={load}>
          {t("Yangilash")}
        </button>
      </div>

      <div className="filter-bar">
        <div className="tag-row-admin type-tabs">
          {TYPE_TABS.map((tab) => {
            const mine = orders.filter((o) => !tab.value || o.orderType === tab.value);
            // Nobody has started on a PENDING order yet, so that is the
            // number worth shouting about: it says which part of the shop
            // is being waited on right now, and it clears itself the
            // moment somebody takes the order on.
            const waiting = mine.filter((o) => o.status === "PENDING").length;
            return (
              <button
                key={tab.value || "all"}
                className={`tag-admin ${typeFilter === tab.value ? "active" : ""} ${
                  waiting > 0 ? "has-waiting" : ""
                }`}
                onClick={() => setTypeFilter(tab.value)}
              >
                {t(tab.label)} <span className="tab-count">{mine.length}</span>
                {waiting > 0 && <span className="tab-waiting">{waiting}</span>}
              </button>
            );
          })}
        </div>
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
      {!loading && shown.length === 0 && <p className="empty-note">{t("Hozircha buyurtmalar yo'q")}</p>}

      {shown.length > 0 && (
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
              {shown.map((order) => (
                <tr
                  key={order.id}
                  className={`clickable-row ${order.status === "PENDING" ? "row-waiting" : ""}`}
                  onClick={() => setSelected(order)}
                >
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
                  <td data-label={t("Jami")}>
                    {order.totalPrice.toLocaleString()}
                    {/* An unpaid order looks exactly like a paid one on a
                        list, which is how money goes missing. It was a dot
                        at first, which on a phone reads as a speck of dust
                        — it has to say what it means. */}
                    <button
                      type="button"
                      className={`pay-chip ${order.isPaid ? "paid" : "unpaid"}`}
                      title={t("Bosib o'zgartiring")}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePaid(order, !order.isPaid);
                      }}
                    >
                      {order.isPaid ? t("To'landi") : t("To'lanmagan")}
                    </button>
                  </td>
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

      <OrderDetailDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onTogglePaid={handleTogglePaid}
        />
    </div>
  );
}
