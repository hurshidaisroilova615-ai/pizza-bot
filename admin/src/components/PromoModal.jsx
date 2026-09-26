import { useState } from "react";
import { useSave } from "../lib/useSave";
import Modal from "./Modal";
import { useT } from "../i18n";

function toInputDate(value) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export default function PromoModal({ promo, onClose, onSave }) {
  const { t } = useT();
  const [form, setForm] = useState({
    code: promo?.code || "",
    type: promo?.type || "PERCENTAGE",
    value: promo?.value ?? "",
    minOrderAmount: promo?.minOrderAmount ?? 0,
    usageLimit: promo?.usageLimit ?? "",
    perUserLimit: promo?.perUserLimit ?? 1,
    newCustomersOnly: promo?.newCustomersOnly ?? false,
    isActive: promo?.isActive ?? true,
    startsAt: toInputDate(promo?.startsAt),
    expiresAt: toInputDate(promo?.expiresAt),
  });
  const { saving, error, save } = useSave();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await save(() => onSave({
        ...form,
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
        perUserLimit: Number(form.perUserLimit) || 1,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }));
  }

  return (
    <Modal title={promo ? t("Promo kodni tahrirlash") : t("Yangi promo kod")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t("Kod")}</label>
          <input
            value={form.code}
            onChange={(e) => update("code", e.target.value.toUpperCase())}
            required
            disabled={Boolean(promo)}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{t("Turi")}</label>
            <select value={form.type} onChange={(e) => update("type", e.target.value)}>
              <option value="PERCENTAGE">{t("Foizli (%)")}</option>
              <option value="FIXED">{t("Aniq summa")}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t("Qiymati")}</label>
            <input type="number" value={form.value} onChange={(e) => update("value", e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{t("Minimal buyurtma")}</label>
            <input
              type="number"
              value={form.minOrderAmount}
              onChange={(e) => update("minOrderAmount", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{t("Umumiy limit (bo'sh = cheksiz)")}</label>
            <input type="number" value={form.usageLimit} onChange={(e) => update("usageLimit", e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t("Har mijoz uchun limit")}</label>
            <input
              type="number"
              value={form.perUserLimit}
              onChange={(e) => update("perUserLimit", e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{t("Boshlanish sanasi")}</label>
            <input type="datetime-local" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t("Tugash sanasi")}</label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => update("expiresAt", e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.newCustomersOnly}
              onChange={(e) => update("newCustomersOnly", e.target.checked)}
            />
            {t("Faqat yangi mijozlar uchun")}
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
            {t("Faol")}
          </label>
        </div>
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
