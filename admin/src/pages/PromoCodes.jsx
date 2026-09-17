import { useEffect, useState } from "react";
import { api } from "../api";
import PromoModal from "../components/PromoModal";

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    api.getPromoCodes().then(setPromoCodes).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSave(form) {
    if (editing) await api.updatePromoCode(editing.id, form);
    else await api.createPromoCode(form);
    setModalOpen(false);
    load();
  }

  async function handleDelete(promo) {
    if (!confirm(`"${promo.code}" promo kodini o'chirmoqchimisiz?`)) return;
    await api.deletePromoCode(promo.id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Promo kodlar</h1>
        <button
          className="btn btn-accent"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Yangi promo kod
        </button>
      </div>

      {loading && <p className="empty-note">Yuklanmoqda...</p>}
      {!loading && promoCodes.length === 0 && <p className="empty-note">Hozircha promo kodlar yo'q</p>}

      {promoCodes.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kod</th>
                <th>Chegirma</th>
                <th>Min. buyurtma</th>
                <th>Ishlatilgan</th>
                <th>Limit</th>
                <th>Amal qilish muddati</th>
                <th>Holati</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((p) => (
                <tr key={p.id}>
                  <td data-label="Kod" className="mono">{p.code}</td>
                  <td data-label="Chegirma">{p.type === "PERCENTAGE" ? `${p.value}%` : p.value.toLocaleString()}</td>
                  <td data-label="Min. buyurtma">{p.minOrderAmount.toLocaleString()}</td>
                  <td data-label="Ishlatilgan">{p.usedCount}</td>
                  <td data-label="Limit">{p.usageLimit ?? "∞"}</td>
                  <td data-label="Muddati">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("uz-UZ") : "—"}</td>
                  <td data-label="Holati">
                    <span className={`status-pill ${p.isActive ? "done" : ""}`}>{p.isActive ? "Faol" : "Nofaol"}</span>
                  </td>
                  <td className="row-actions" style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setEditing(p);
                        setModalOpen(true);
                      }}
                    >
                      Tahrirlash
                    </button>
                    <button className="btn btn-outline" onClick={() => handleDelete(p)}>
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && <PromoModal promo={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}
    </div>
  );
}
