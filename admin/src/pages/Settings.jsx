import { useEffect, useState } from "react";
import { api } from "../api";

export default function Settings({ onBusinessNameChange }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then(setForm)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings({
        businessName: form.businessName,
        businessType: form.businessType,
        currency: form.currency,
        primaryColor: form.primaryColor,
        logoUrl: form.logoUrl || null,
        deliveryFee: Number(form.deliveryFee) || 0,
        freeDeliveryThreshold: form.freeDeliveryThreshold === "" ? null : Number(form.freeDeliveryThreshold),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        loyaltyEnabled: form.loyaltyEnabled,
        loyaltyEarnRate: Number(form.loyaltyEarnRate),
        loyaltyPointValue: Number(form.loyaltyPointValue),
        supportPhone: form.supportPhone || null,
        supportUsername: form.supportUsername || null,
        welcomeMessage: form.welcomeMessage || null,
        aboutText: form.aboutText || null,
      });
      setForm(updated);
      onBusinessNameChange?.(updated.businessName);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <p className="empty-note">Yuklanmoqda...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Biznes sozlamalari</h1>
      </div>
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>
        Bu yerdagi sozlamalar Mini App va botga darhol ta'sir qiladi. Shu forma orqali platformani istalgan
        biznes turiga (pizza, burger, sushi, kiyim, kosmetika va h.k.) moslashtirishingiz mumkin — kodni
        o'zgartirish shart emas.
      </p>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>Brend</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Biznes nomi</label>
              <input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Biznes turi</label>
              <input value={form.businessType} onChange={(e) => update("businessType", e.target.value)} placeholder="food, fashion, cosmetics..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valyuta</label>
              <input value={form.currency} onChange={(e) => update("currency", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Asosiy rang</label>
              <input type="color" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Logo URL</label>
              <input value={form.logoUrl || ""} onChange={(e) => update("logoUrl", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Yetkazib berish va buyurtma</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Yetkazib berish narxi</label>
              <input type="number" value={form.deliveryFee} onChange={(e) => update("deliveryFee", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Bepul yetkazish chegarasi (bo'sh = yo'q)</label>
              <input
                type="number"
                value={form.freeDeliveryThreshold ?? ""}
                onChange={(e) => update("freeDeliveryThreshold", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Minimal buyurtma summasi</label>
              <input type="number" value={form.minOrderAmount} onChange={(e) => update("minOrderAmount", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Loyalty (bonus ball) tizimi</h3>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.loyaltyEnabled} onChange={(e) => update("loyaltyEnabled", e.target.checked)} />
            Loyalty tizimi yoqilgan
          </label>
          <div className="form-row">
            <div className="form-group">
              <label>Ball to'plash foizi (masalan 0.05 = 5%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={form.loyaltyEarnRate}
                onChange={(e) => update("loyaltyEarnRate", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>1 ball = necha pul birligi</label>
              <input
                type="number"
                value={form.loyaltyPointValue}
                onChange={(e) => update("loyaltyPointValue", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Aloqa va xabarlar</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Qo'llab-quvvatlash telefoni</label>
              <input value={form.supportPhone || ""} onChange={(e) => update("supportPhone", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Qo'llab-quvvatlash Telegram username</label>
              <input value={form.supportUsername || ""} onChange={(e) => update("supportUsername", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Botning /start xabari</label>
            <textarea rows={2} value={form.welcomeMessage || ""} onChange={(e) => update("welcomeMessage", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Mini App bosh sahifasidagi tavsif</label>
            <textarea rows={2} value={form.aboutText || ""} onChange={(e) => update("aboutText", e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          {saved && <span className="form-success">Saqlandi ✓</span>}
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
          </button>
        </div>
      </form>
    </div>
  );
}
