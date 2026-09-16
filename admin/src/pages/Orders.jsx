import { useEffect, useState } from "react";
import { api } from "../api";
import OrderDetailDrawer from "../components/OrderDetailDrawer";

const STATUS_LABELS = {
  PENDING: "Qabul qilindi",
  PREPARING: "Tayyorlanmoqda",
  ON_DELIVERY: "Kuryerda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
};

const STATUS_FILTERS = ["", "PENDING", "PREPARING", "ON_DELIVERY", "DELIVERED", "CANCELLED"];

export default function Orders() {
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
    const updated = await api.updateOrderStatus(order.id, status);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelected(updated);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Buyurtmalar</h1>
        <button className="btn btn-outline" onClick={load}>
          Yangilash
        </button>
      </div>

      <div className="tag-row-admin">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || "all"}
            className={`tag-admin ${statusFilter === s ? "active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s ? STATUS_LABELS[s] : "Barchasi"}
          </button>
        ))}
      </div>

      {loading && <p className="empty-note">Yuklanmoqda...</p>}
      {!loading && orders.length === 0 && <p className="empty-note">Hozircha buyurtmalar yo'q</p>}

      {orders.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Mijoz</th>
                <th>Telefon</th>
                <th>Mahsulotlar</th>
                <th>Jami</th>
                <th>Sana</th>
                <th>Holati</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="clickable-row" onClick={() => setSelected(order)}>
                  <td>#{order.id}</td>
                  <td>{order.user?.firstName || "—"}</td>
                  <td>{order.phone || order.user?.phone || "—"}</td>
                  <td className="truncate-cell">{order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}</td>
                  <td>{order.totalPrice.toLocaleString()}</td>
                  <td>{new Date(order.createdAt).toLocaleString("uz-UZ")}</td>
                  <td>
                    <span className={`status-pill status-${order.status.toLowerCase()}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
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
