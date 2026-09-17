import { useEffect, useState } from "react";
import { api } from "../api";
import CustomerDetailDrawer from "../components/CustomerDetailDrawer";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);

  function load() {
    setLoading(true);
    api
      .getCustomers(search)
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!selectedId) return setSelected(null);
    api.getCustomer(selectedId).then(setSelected).catch(console.error);
  }, [selectedId]);

  return (
    <div>
      <div className="page-header">
        <h1>Mijozlar (CRM)</h1>
        <input
          className="search-input"
          placeholder="Ism, telefon yoki Telegram ID bo'yicha qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="empty-note">Yuklanmoqda...</p>}
      {!loading && customers.length === 0 && <p className="empty-note">Mijozlar topilmadi</p>}

      {customers.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Buyurtmalar</th>
                <th>Jami xarid</th>
                <th>Oxirgi buyurtma</th>
                <th>Bonus ball</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="clickable-row" onClick={() => setSelectedId(c.id)}>
                  <td data-label="Ism">{c.firstName || "—"} {c.lastName || ""}</td>
                  <td data-label="Telefon">{c.phone || "—"}</td>
                  <td data-label="Buyurtmalar">{c.ordersCount}</td>
                  <td data-label="Jami xarid">{c.totalSpent.toLocaleString()}</td>
                  <td data-label="Oxirgi buyurtma">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("uz-UZ") : "—"}
                  </td>
                  <td data-label="Bonus ball">{c.loyaltyPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerDetailDrawer
        customer={selected}
        onClose={() => setSelectedId(null)}
        onAdjusted={() => {
          load();
          api.getCustomer(selectedId).then(setSelected);
        }}
      />
    </div>
  );
}
