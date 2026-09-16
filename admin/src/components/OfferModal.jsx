import { useState } from "react";
import Modal from "./Modal";

const SEGMENTS = [
  { value: "ALL", label: "Barcha mijozlar" },
  { value: "NEW_CUSTOMERS", label: "Yangi mijozlar" },
  { value: "LOYAL_CUSTOMERS", label: "Sodiq mijozlar (5+ buyurtma)" },
  { value: "INACTIVE_CUSTOMERS", label: "Uzoq vaqt buyurtma bermaganlar (30+ kun)" },
];

export default function OfferModal({ offer, promoCodes, onClose, onSave }) {
  const [form, setForm] = useState({
    title: offer?.title || "",
    message: offer?.message || "",
    imageUrl: offer?.imageUrl || "",
    segment: offer?.segment || "ALL",
    promoCodeId: offer?.promoCodeId ?? "",
    isActive: offer?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        imageUrl: form.imageUrl || null,
        promoCodeId: form.promoCodeId === "" ? null : Number(form.promoCodeId),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={offer ? "Taklifni tahrirlash" : "Yangi maxsus taklif"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Sarlavha</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Xabar matni</label>
          <textarea rows={3} value={form.message} onChange={(e) => update("message", e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Rasm URL (ixtiyoriy)</label>
          <input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Maqsadli auditoriya</label>
            <select value={form.segment} onChange={(e) => update("segment", e.target.value)}>
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Bog'liq promo kod (ixtiyoriy)</label>
            <select value={form.promoCodeId} onChange={(e) => update("promoCodeId", e.target.value)}>
              <option value="">Yo'q</option>
              {promoCodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
          Faol
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Bekor qilish
          </button>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
