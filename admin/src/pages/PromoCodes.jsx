import { useEffect, useState } from "react";
import { api } from "../api";
import PromoModal from "../components/PromoModal";
import { useT } from "../i18n";

export default function PromoCodes() {
  const { t } = useT();
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
    if (!confirm(t("«{code}» promo kodini o'chirmoqchimisiz?", { code: promo.code }))) return;
    await api.deletePromoCode(promo.id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t("Promo kodlar")}</h1>
        <button
          className="btn btn-accent"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          {t("+ Yangi promo kod")}
        </button>
      </div>

      {loading && <p className="empty-note">{t("Yuklanmoqda...")}</p>}
      {!loading && promoCodes.length === 0 && <p className="empty-note">{t("Hozircha promo kodlar yo'q")}</p>}

      {promoCodes.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Kod")}</th>
                <th>{t("Chegirma")}</th>
                <th>{t("Min. buyurtma")}</th>
                <th>{t("Ishlatilgan")}</th>
                <th>{t("Limit")}</th>
                <th>{t("Amal qilish muddati")}</th>
                <th>{t("Holati")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((p) => (
                <tr key={p.id}>
                  <td data-label={t("Kod")} className="mono">{p.code}</td>
                  <td data-label={t("Chegirma")}>{p.type === "PERCENTAGE" ? `${p.value}%` : p.value.toLocaleString()}</td>
                  <td data-label={t("Min. buyurtma")}>{p.minOrderAmount.toLocaleString()}</td>
                  <td data-label={t("Ishlatilgan")}>{p.usedCount}</td>
                  <td data-label={t("Limit")}>{p.usageLimit ?? "∞"}</td>
                  <td data-label={t("Muddati")}>{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("uz-UZ") : "—"}</td>
                  <td data-label={t("Holati")}>
                    <span className={`status-pill ${p.isActive ? "done" : ""}`}>{p.isActive ? t("Faol") : t("Nofaol")}</span>
                  </td>
                  <td className="row-actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setEditing(p);
                        setModalOpen(true);
                      }}
                    >
                      {t("Tahrirlash")}
                    </button>
                    <button className="btn btn-outline" onClick={() => handleDelete(p)}>
                      {t("O'chirish")}
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
