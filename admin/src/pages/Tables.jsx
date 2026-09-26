import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { api } from "../api";
import { useSave } from "../lib/useSave";

// The codes a cafe prints and sticks on its tables.
//
// Each one is the shop's own web address with ?table= on the end, so a
// customer who scans it lands on the menu already at their table: no app to
// install, no address to type, no waiter to wait for. The number lives in
// the code itself, which is why nothing here has to be kept in step with
// the room — adding a table means printing one more sticker.
const SITE_KEY = "shop_site_url";

export default function Tables() {
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [count, setCount] = useState(0);
  const [siteUrl, setSiteUrl] = useState("");
  const [codes, setCodes] = useState([]);
  const { saving, error, save } = useSave();

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        setSettings(s);
        setCount(s.tableCount || 0);
      })
      .catch((err) => setLoadError(err?.message || "Sozlamalarni yuklab bo'lmadi."));
    // Where the codes point. The admin panel is served from a different
    // address than the shop itself, so this cannot be read off the page —
    // it is the link the owner gives to customers.
    try {
      const saved = localStorage.getItem(SITE_KEY);
      if (saved) setSiteUrl(saved);
    } catch {
      // storage blocked; the owner types it each visit
    }
  }, []);

  const tables = useMemo(
    () => Array.from({ length: Math.max(0, Math.min(count, 300)) }, (_, i) => String(i + 1)),
    [count]
  );

  function linkFor(table) {
    const base = siteUrl.trim().replace(/[?#].*$/, "").replace(/\/+$/, "");
    return `${base}/?table=${encodeURIComponent(table)}`;
  }

  // Drawn as SVG rather than a picture: these get printed, and a QR code
  // that has been through a bitmap does not always scan off paper.
  useEffect(() => {
    let active = true;
    if (!siteUrl.trim() || tables.length === 0) {
      setCodes([]);
      return undefined;
    }
    Promise.all(
      tables.map((table) =>
        QRCode.toString(linkFor(table), { type: "svg", margin: 0, errorCorrectionLevel: "M" }).then(
          (svg) => ({ table, svg })
        )
      )
    )
      .then((made) => active && setCodes(made))
      .catch(() => active && setCodes([]));
    return () => {
      active = false;
    };
  }, [siteUrl, tables]);

  async function persist(patch) {
    const { ok, result } = await save(() => api.updateSettings(patch));
    if (ok) setSettings(result);
  }

  function rememberUrl(value) {
    setSiteUrl(value);
    try {
      localStorage.setItem(SITE_KEY, value);
    } catch {
      // storage blocked; it still works for this visit
    }
  }

  if (loadError) return <p className="form-error save-error">{loadError}</p>;
  if (!settings) return <p className="empty-note">Yuklanmoqda...</p>;

  return (
    <div>
      <div className="page-header no-print">
        <h1>Stol QR kodlari</h1>
        <button className="btn btn-primary" onClick={() => window.print()} disabled={codes.length === 0}>
          Chop etish
        </button>
      </div>

      <p className="muted no-print" style={{ marginTop: -12, marginBottom: 24 }}>
        Har bir stolga o'z kodi yopishtiriladi. Mijoz kodni skanerlaydi, menyu ochiladi,
        buyurtma beradi — stol raqami o'zi qo'shiladi. Hech narsa o'rnatish kerak emas.
      </p>

      <div className="settings-section no-print">
        <h3>Sozlash</h3>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(settings.dineInEnabled)}
            onChange={(e) => persist({ dineInEnabled: e.target.checked })}
          />
          Zaldan buyurtma (stoldagi QR kod orqali)
        </label>

        <div className="form-row">
          <div className="form-group">
            <label>Do'kon sayti manzili</label>
            <input
              placeholder="https://smartorder-miniapp.onrender.com"
              value={siteUrl}
              onChange={(e) => rememberUrl(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Stollar soni</label>
            <input
              type="number"
              min={0}
              max={300}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              onBlur={() => persist({ tableCount: Math.max(0, Math.min(count, 300)) })}
            />
          </div>
        </div>

        {saving && <span className="muted">Saqlanmoqda...</span>}
        {error && <span className="form-error save-error">{error}</span>}
        {!settings.dineInEnabled && (
          <p className="muted">
            Zaldan buyurtma o'chirilgan — kod skanerlansa oddiy menyu ochiladi, stol raqami
            qo'shilmaydi.
          </p>
        )}
      </div>

      {codes.length === 0 ? (
        <p className="empty-note no-print">
          Sayt manzilini va stollar sonini kiriting — kodlar shu yerda chiqadi.
        </p>
      ) : (
        <div className="qr-sheet">
          {codes.map(({ table, svg }) => (
            <div className="qr-card" key={table}>
              <p className="qr-shop">{settings.businessName}</p>
              <div className="qr-image" dangerouslySetInnerHTML={{ __html: svg }} />
              <p className="qr-table">Stol {table}</p>
              <p className="qr-hint">Kodni skanerlang va buyurtma bering</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
