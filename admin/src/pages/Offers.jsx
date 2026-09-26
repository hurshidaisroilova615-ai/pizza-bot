import { useEffect, useState } from "react";
import { api } from "../api";
import OfferModal from "../components/OfferModal";
import { useT } from "../i18n";

const SEGMENT_LABELS = {
  ALL: "Barchasi",
  NEW_CUSTOMERS: "Yangi mijozlar",
  LOYAL_CUSTOMERS: "Sodiq mijozlar",
  INACTIVE_CUSTOMERS: "Nofaol mijozlar",
};

export default function Offers() {
  const { t } = useT();
  const [offers, setOffers] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([api.getOffers(), api.getPromoCodes()])
      .then(([o, p]) => {
        setOffers(o);
        setPromoCodes(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSave(form) {
    if (editing) await api.updateOffer(editing.id, form);
    else await api.createOffer(form);
    setModalOpen(false);
    load();
  }

  async function handleDelete(offer) {
    if (!confirm(`"${offer.title}" taklifini o'chirmoqchimisiz?`)) return;
    await api.deleteOffer(offer.id);
    load();
  }

  async function handleSend(offer) {
    if (!confirm(`"${offer.title}" — ${t(SEGMENT_LABELS[offer.segment])}?`)) return;
    setSendingId(offer.id);
    try {
      const result = await api.sendOffer(offer.id);
      alert(`Yuborildi: ${result.sent}/${result.total} mijozga`);
      load();
    } catch (err) {
      // A campaign that silently fails to send is worse than one that
      // fails loudly: the owner waits for orders that are never coming.
      alert(`Yuborib bo'lmadi: ${err.message}`);
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t("Maxsus takliflar")}</h1>
        <button
          className="btn btn-accent"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          {t("+ Yangi taklif")}
        </button>
      </div>

      {loading && <p className="empty-note">{t("Yuklanmoqda...")}</p>}
      {!loading && offers.length === 0 && <p className="empty-note">{t("Hozircha takliflar yo'q")}</p>}

      <div className="offer-grid">
        {offers.map((offer) => (
          <div className="offer-card" key={offer.id}>
            <div className="offer-card-header">
              <h3>{offer.title}</h3>
              <span className={`status-pill ${offer.isActive ? "done" : ""}`}>
                {offer.isActive ? t("Faol") : t("Nofaol")}
              </span>
            </div>
            <p className="muted">{offer.message}</p>
            <p className="offer-segment">🎯 {t(SEGMENT_LABELS[offer.segment])}</p>
            {offer.promoCode && <p className="mono">Promo: {offer.promoCode.code}</p>}
            {offer.sentAt && (
              <p className="muted">
                Oxirgi yuborilgan: {new Date(offer.sentAt).toLocaleString("uz-UZ")} ({offer.sentCount} ta)
              </p>
            )}
            <div className="offer-card-actions">
              <button className="btn btn-outline" onClick={() => { setEditing(offer); setModalOpen(true); }}>
                {t("Tahrirlash")}
              </button>
              <button className="btn btn-outline" onClick={() => handleDelete(offer)}>
                {t("O'chirish")}
              </button>
              <button className="btn btn-accent" onClick={() => handleSend(offer)} disabled={sendingId === offer.id}>
                {sendingId === offer.id ? t("Yuborilmoqda...") : t("Yuborish")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <OfferModal offer={editing} promoCodes={promoCodes} onClose={() => setModalOpen(false)} onSave={handleSave} />
      )}
    </div>
  );
}
