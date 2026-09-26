import { useState } from "react";
import { api } from "../api";
import { useSave } from "../lib/useSave";
import { useT } from "../i18n";

// Moving every price in the shop to another currency at once.
//
// The same menu gets sold in Jizzakh and in Osh, and 60 000 so'm is a
// pizza while 60 000 som is a month's rent. Retyping thirty prices before
// a demo is how a wrong one ends up on a customer's screen, so the shop
// converts itself — and shows the new menu before anything is saved,
// because this changes every price at once and cannot be undone by hand.
const PRESETS = [
  { label: "So'mdan somga (O'zbekiston → Qirg'iziston)", rate: 145, roundTo: 5, currency: "сом" },
  { label: "Somdan so'mga (Qirg'iziston → O'zbekiston)", rate: 1 / 145, roundTo: 1000, currency: "so'm" },
];

export default function CurrencyConverter({ onDone }) {
  const { t } = useT();
  const [rate, setRate] = useState("145");
  const [roundTo, setRoundTo] = useState("5");
  const [currency, setCurrency] = useState("сом");
  const [preview, setPreview] = useState(null);
  const { saving, error, save } = useSave();

  function usePreset(preset) {
    setRate(String(preset.rate));
    setRoundTo(String(preset.roundTo));
    setCurrency(preset.currency);
    setPreview(null);
  }

  const body = () => ({
    rate: Number(rate),
    roundTo: Number(roundTo) || 1,
    currency: currency.trim() || undefined,
  });

  const valid = Number(rate) > 0;

  async function look() {
    const { ok, result } = await save(() => api.previewCurrency(body()));
    if (ok) setPreview(result);
  }

  async function apply() {
    const { ok } = await save(() => api.applyCurrency(body()));
    if (!ok) return;
    setPreview(null);
    onDone?.();
  }

  return (
    <div className="settings-section">
      <h3>{t("Narxlarni boshqa valyutaga o'tkazish")}</h3>
      <p className="muted" style={{ marginTop: -6 }}>{t("Menyudagi barcha narxlar, yetkazib berish narxi, minimal summa va belgilangan summali promo kodlar birdan o'zgaradi. Avval natijani ko'rsatadi — rozi bo'lsangiz saqlaysiz.")}</p>

      <div className="form-row">
        {PRESETS.map((preset) => (
          <button key={t(preset.label)} type="button" className="btn btn-outline" onClick={() => usePreset(preset)}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{t("Kurs (1 yangi valyuta necha eskiga teng)")}</label>
          <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="145" />
        </div>
        <div className="form-group">
          <label>{t("Yaxlitlash")}</label>
          <input value={roundTo} onChange={(e) => setRoundTo(e.target.value)} placeholder="5" />
        </div>
        <div className="form-group">
          <label>{t("Yangi valyuta belgisi")}</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="сом" />
        </div>
      </div>

      <div className="form-row">
        <button type="button" className="btn btn-outline" onClick={look} disabled={!valid || saving}>
          {saving && !preview ? t("Hisoblanmoqda...") : t("Natijani ko'rish")}
        </button>
        {preview && (
          <button type="button" className="btn btn-primary" onClick={apply} disabled={saving}>
            {saving ? t("Saqlanmoqda...") : t("Saqlash")}
          </button>
        )}
      </div>

      {error && <span className="form-error save-error">{error}</span>}

      {preview && (
        <div className="convert-preview">
          <table className="convert-table">
            <tbody>
              {preview.products.slice(0, 8).map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="convert-before">{p.before.toLocaleString()}</td>
                  <td className="convert-after">{p.after.toLocaleString()} {currency}</td>
                </tr>
              ))}
              <tr>
                <td>{t("Yetkazib berish")}</td>
                <td className="convert-before">{preview.settings.deliveryFee.before.toLocaleString()}</td>
                <td className="convert-after">
                  {preview.settings.deliveryFee.after.toLocaleString()} {currency}
                </td>
              </tr>
            </tbody>
          </table>
          {preview.products.length > 8 && (
            <p className="muted">...va yana {preview.products.length - 8} ta mahsulot</p>
          )}
        </div>
      )}
    </div>
  );
}
