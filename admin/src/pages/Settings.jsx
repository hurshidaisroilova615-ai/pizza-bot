import { useEffect, useState } from "react";
import { api } from "../api";
import ChangePasswordForm from "../components/ChangePasswordForm";
import CurrencyConverter from "../components/CurrencyConverter";
import { useSave } from "../lib/useSave";
import { useT } from "../i18n";

export default function Settings({ onBusinessNameChange }) {
  const { t } = useT();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(false);
  const { saving, error, save } = useSave();

  useEffect(() => {
    api
      .getSettings()
      .then(setForm)
      // Without this the page sat on t("Yuklanmoqda...") for ever and never
      // said why, which looks identical to a slow connection.
      .catch((err) => setLoadError(err?.message || t("Sozlamalarni yuklab bo'lmadi.")))
      .finally(() => setLoading(false));
  }, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaved(false);
    const { ok, result } = await save(() =>
      api.updateSettings({
        businessName: form.businessName,
        businessType: form.businessType,
        ownerLanguage: form.ownerLanguage || "uz",
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
        orderNotifyChatIds: form.orderNotifyChatIds || null,
        openTime: form.openTime || null,
        closeTime: form.closeTime || null,
        timezoneOffset: Number(form.timezoneOffset ?? 5),
        deliveryEnabled: form.deliveryEnabled,
        pickupEnabled: form.pickupEnabled,
        pickupAddress: form.pickupAddress || null,
        cardPaymentEnabled: form.cardPaymentEnabled,
        cardPaymentDetails: form.cardPaymentDetails || null,
        cardPaymentHolder: form.cardPaymentHolder || null,
        welcomeMessage: form.welcomeMessage || null,
        aboutText: form.aboutText || null,
      })
    );
    if (!ok) return;
    setForm(result);
    onBusinessNameChange?.(result.businessName);
    setSaved(true);
  }

  if (loading) return <p className="empty-note">{t("Yuklanmoqda...")}</p>;
  if (loadError || !form) {
    return (
      <div>
        <div className="page-header">
          <h1>{t("Biznes sozlamalari")}</h1>
        </div>
        <p className="form-error save-error">
          {loadError || t("Sozlamalarni yuklab bo'lmadi.")}
        </p>
        <button className="btn btn-outline" onClick={() => window.location.reload()}>
          {t("Qayta urinish")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t("Biznes sozlamalari")}</h1>
      </div>
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>{t("Bu yerdagi sozlamalar Mini App va botga darhol ta'sir qiladi. Shu forma orqali platformani istalgan biznes turiga (pizza, burger, sushi, kiyim, kosmetika va h.k.) moslashtirishingiz mumkin — kodni o'zgartirish shart emas.")}</p>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>{t("Brend")}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>{t("Biznes nomi")}</label>
              <input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{t("Biznes turi")}</label>
              <input value={form.businessType} onChange={(e) => update("businessType", e.target.value)} placeholder="food, fashion, cosmetics..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t("Valyuta")}</label>
              <input value={form.currency} onChange={(e) => update("currency", e.target.value)} />
            </div>
            <div className="form-group">
              {/* The owner's own language, not the customer's — it decides
                  what the order alerts are written in. */}
              <label>{t("Sizning tilingiz (buyurtma xabarlari)")}</label>
              <select
                value={form.ownerLanguage || "uz"}
                onChange={(e) => update("ownerLanguage", e.target.value)}
              >
                <option value="uz">{t("O'zbekcha")}</option>
                <option value="ru">{t("Русский")}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t("Asosiy rang")}</label>
              <input type="color" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t("Logo URL")}</label>
              <input value={form.logoUrl || ""} onChange={(e) => update("logoUrl", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>{t("Yetkazib berish va buyurtma")}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>{t("Yetkazib berish narxi")}</label>
              <input type="number" value={form.deliveryFee} onChange={(e) => update("deliveryFee", e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t("Bepul yetkazish chegarasi (bo'sh = yo'q)")}</label>
              <input
                type="number"
                value={form.freeDeliveryThreshold ?? ""}
                onChange={(e) => update("freeDeliveryThreshold", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t("Minimal buyurtma summasi")}</label>
              <input type="number" value={form.minOrderAmount} onChange={(e) => update("minOrderAmount", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>{t("Ish vaqti")}</h3>
          <p className="field-hint" style={{ marginBottom: 16 }}>{t("Ish vaqtidan tashqarida bot buyurtma qabul qilmaydi va mijozga qachon ochilishini aytadi. Tunda yopiladigan joylar uchun yopilish vaqti ochilishdan kichik bo'lishi mumkin — masalan 07:00 dan 02:00 gacha.")}</p>
          <div className="form-row">
            <div className="form-group">
              <label>{t("Ochilish vaqti")}</label>
              <input
                type="time"
                value={form.openTime || ""}
                onChange={(e) => update("openTime", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t("Yopilish vaqti")}</label>
              <input
                type="time"
                value={form.closeTime || ""}
                onChange={(e) => update("closeTime", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t("Vaqt mintaqasi (UTC+)")}</label>
              <input
                type="number"
                min="-12"
                max="14"
                value={form.timezoneOffset ?? 5}
                onChange={(e) => update("timezoneOffset", e.target.value)}
              />
              <span className="field-hint">{t("O'zbekiston 5, Qirg'iziston 6")}</span>
            </div>
          </div>
          <p className="field-hint">
            {t("Ikkala katak bo'sh bo'lsa, bot doim buyurtma qabul qiladi.")}
          </p>
        </div>

        <div className="settings-section">
          <h3>{t("Buyurtma va to'lov turlari")}</h3>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.deliveryEnabled !== false}
              onChange={(e) => update("deliveryEnabled", e.target.checked)}
            />
            {t("Yetkazib berish")}
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(form.pickupEnabled)}
              onChange={(e) => update("pickupEnabled", e.target.checked)}
            />
            {t("Olib ketish (mijoz o'zi keladi — yetkazish narxi olinmaydi)")}
          </label>
          {form.pickupEnabled && (
            <div className="form-group">
              <label>{t("Olib ketish manzili")}</label>
              <input
                value={form.pickupAddress || ""}
                onChange={(e) => update("pickupAddress", e.target.value)}
                placeholder={t("Mijoz qaerdan oladi")}
              />
            </div>
          )}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(form.cardPaymentEnabled)}
              onChange={(e) => update("cardPaymentEnabled", e.target.checked)}
            />
            {t("Karta orqali to'lov (mijoz naqd yoki karta tanlaydi)")}
          </label>
          {form.cardPaymentEnabled && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>{t("Karta raqami")}</label>
                  <input
                    value={form.cardPaymentDetails || ""}
                    onChange={(e) => update("cardPaymentDetails", e.target.value)}
                    placeholder="8600 1234 5678 9012"
                  />
                </div>
                <div className="form-group">
                  <label>{t("Karta egasining ismi")}</label>
                  <input
                    value={form.cardPaymentHolder || ""}
                    onChange={(e) => update("cardPaymentHolder", e.target.value)}
                    placeholder={t("Masalan: Alisher T.")}
                  />
                </div>
              </div>
              <p className="field-hint">{t("Mijoz «Karta» ni tanlaganda shu raqam ko'rsatiladi va u pulni o'tkazib, chekni botga yuboradi. Raqam kiritilmasa, mijozga karta varianti umuman ko'rsatilmaydi. Bu Payme yoki Click orqali avtomatik to'lov emas — pul to'g'ridan-to'g'ri shu kartaga tushadi va tushganini o'zingiz tekshirasiz.")}</p>
            </>
          )}
        </div>

        <div className="settings-section">
          <h3>{t("Loyalty (bonus ball) tizimi")}</h3>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.loyaltyEnabled} onChange={(e) => update("loyaltyEnabled", e.target.checked)} />
            {t("Loyalty tizimi yoqilgan")}
          </label>
          <div className="form-row">
            <div className="form-group">
              <label>{t("Ball to'plash foizi (masalan 0.05 = 5%)")}</label>
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
              <label>{t("1 ball = necha pul birligi")}</label>
              <input
                type="number"
                value={form.loyaltyPointValue}
                onChange={(e) => update("loyaltyPointValue", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>{t("Aloqa va xabarlar")}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>{t("Qo'llab-quvvatlash telefoni")}</label>
              <input value={form.supportPhone || ""} onChange={(e) => update("supportPhone", e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t("Qo'llab-quvvatlash Telegram username")}</label>
              <input value={form.supportUsername || ""} onChange={(e) => update("supportUsername", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>{t("Yangi buyurtma xabari kimga kelsin")}</label>
            <input
              value={form.orderNotifyChatIds || ""}
              onChange={(e) => update("orderNotifyChatIds", e.target.value)}
              placeholder="masalan: 123456789"
            />
            <span className="field-hint">
              {t("Telegram ID raqamini bilish uchun botga")} <strong>/id</strong>{" "}
              {t("deb yozing — u raqamingizni qaytaradi. Bir nechta bo'lsa vergul bilan ajrating.")}
            </span>
          </div>

          <div className="form-group">
            <label>{t("Botning /start xabari")}</label>
            <textarea rows={2} value={form.welcomeMessage || ""} onChange={(e) => update("welcomeMessage", e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t("Mini App bosh sahifasidagi tavsif")}</label>
            <textarea rows={2} value={form.aboutText || ""} onChange={(e) => update("aboutText", e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          {saved && <span className="form-success">{t("Saqlandi ✓")}</span>}
          {error && <span className="form-error save-error">{error}</span>}
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? t("Saqlanmoqda...") : t("Sozlamalarni saqlash")}
          </button>
        </div>
      </form>

      {/* Outside the settings form on purpose: this one writes every price
          in the shop the moment it is confirmed, and must not ride along
          with an ordinary save. */}
      <CurrencyConverter
        onDone={() => api.getSettings().then(setForm).catch(() => window.location.reload())}
      />

      <ChangePasswordForm />
    </div>
  );
}
