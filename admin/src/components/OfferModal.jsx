import { useState } from "react";
import { useSave } from "../lib/useSave";
import Modal from "./Modal";
import { useT } from "../i18n";

const SEGMENTS = [
  { value: "ALL", label: "Barcha mijozlar" },
  { value: "NEW_CUSTOMERS", label: "Yangi mijozlar" },
  { value: "LOYAL_CUSTOMERS", label: "Sodiq mijozlar (5+ buyurtma)" },
  { value: "INACTIVE_CUSTOMERS", label: "Uzoq vaqt buyurtma bermaganlar (30+ kun)" },
];

export default function OfferModal({ offer, promoCodes, onClose, onSave }) {
  const { t } = useT();
  const [form, setForm] = useState({
    title: offer?.title || "",
    message: offer?.message || "",
    imageUrl: offer?.imageUrl || "",
    segment: offer?.segment || "ALL",
    promoCodeId: offer?.promoCodeId ?? "",
    isActive: offer?.isActive ?? true,
  });
  const { saving, error, save } = useSave();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await save(() => onSave({
        ...form,
        imageUrl: form.imageUrl || null,
        promoCodeId: form.promoCodeId === "" ? null : Number(form.promoCodeId),
      }));
  }

  return (
    <Modal title={offer ? t("Taklifni tahrirlash") : t("Yangi maxsus taklif")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t("Sarlavha")}</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t("Xabar matni")}</label>
          <textarea rows={3} value={form.message} onChange={(e) => update("message", e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t("Rasm URL (ixtiyoriy)")}</label>
          <input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{t("Maqsadli auditoriya")}</label>
            <select value={form.segment} onChange={(e) => update("segment", e.target.value)}>
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t("Bog'liq promo kod (ixtiyoriy)")}</label>
            <select value={form.promoCodeId} onChange={(e) => update("promoCodeId", e.target.value)}>
              <option value="">{t("Yo'q")}</option>
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
          {t("Faol")}
        </label>
        {error && <p className="form-error save-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t("Bekor qilish")}
          </button>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? t("Saqlanmoqda...") : t("Saqlash")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
