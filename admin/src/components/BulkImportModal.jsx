import { useMemo, useState } from "react";
import Modal from "./Modal";
import { api } from "../api";

const EXAMPLE = `Margarita | 49000 | Pizza
Peperoni | 59000 | Pizza
Chizburger | 32000 | Burgerlar
Tovuqli lavash | 30000 | Lavash
Kola 0.5L | 12000 | Ichimliklar`;

// Owners send their menu as a plain list, so accept it in that shape: one
// dish per line, fields split by | or by tab when it comes out of a
// spreadsheet. Anything unparseable is shown back rather than dropped.
function parseMenu(text) {
  const rows = [];
  const problems = [];

  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const parts = line.split(/\s*[|\t]\s*/);
      const [name, rawPrice, category, description] = parts;

      if (!name || !rawPrice) {
        problems.push({ line: index + 1, text: line, why: "narx ko'rsatilmagan" });
        return;
      }

      const price = Number(String(rawPrice).replace(/[^\d]/g, ""));
      if (!price) {
        problems.push({ line: index + 1, text: line, why: "narxni o'qib bo'lmadi" });
        return;
      }

      rows.push({
        name,
        price,
        category: category || undefined,
        description: description || undefined,
      });
    });

  return { rows, problems };
}

export default function BulkImportModal({ onClose, onImported }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const { rows, problems } = useMemo(() => parseMenu(text), [text]);

  async function handleImport() {
    setSaving(true);
    try {
      const response = await api.bulkCreateProducts(rows);
      setResult(response);
      onImported();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <Modal title="Menyu qo'shildi" onClose={onClose}>
        <p className="import-result">
          <strong>{result.createdCount} ta</strong> mahsulot qo'shildi.
        </p>
        {result.skippedCount > 0 && (
          <p className="muted">
            {result.skippedCount} tasi o'tkazib yuborildi — bu nomlar allaqachon bor:{" "}
            {result.skipped.join(", ")}
          </p>
        )}
        <p className="muted">
          Rasmlar hozircha belgi ko'rinishida. Xohlagan mahsulotni ochib, o'z rasmini yuklashingiz
          mumkin.
        </p>
        <div className="modal-actions">
          <button className="btn btn-accent" onClick={onClose}>
            Yopish
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Menyuni ro'yxat bilan qo'shish" onClose={onClose} wide>
      <p className="muted" style={{ marginTop: 0 }}>
        Har bir taom alohida qatorda. Tartib: <strong>Nomi | narx | kategoriya</strong>. Kategoriya
        ixtiyoriy — yo'q kategoriyalar o'zi yaratiladi.
      </p>

      <div className="form-group">
        <label>Menyu ro'yxati</label>
        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}
        />
      </div>

      {text.trim() && (
        <div className="import-preview">
          <p className="import-count">
            Tayyor: <strong>{rows.length} ta</strong> mahsulot
            {problems.length > 0 && <span className="import-bad"> · {problems.length} ta qator xato</span>}
          </p>

          {rows.slice(0, 4).map((r, i) => (
            <div className="import-row" key={i}>
              <span>{r.name}</span>
              <span className="muted">
                {r.price.toLocaleString()}
                {r.category ? ` · ${r.category}` : ""}
              </span>
            </div>
          ))}
          {rows.length > 4 && <p className="muted">…va yana {rows.length - 4} ta</p>}

          {problems.map((p) => (
            <div className="import-row import-bad" key={p.line}>
              <span>{p.line}-qator: {p.text}</span>
              <span>{p.why}</span>
            </div>
          ))}
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Bekor qilish
        </button>
        <button
          type="button"
          className="btn btn-accent"
          onClick={handleImport}
          disabled={saving || rows.length === 0}
        >
          {saving ? "Qo'shilmoqda..." : `${rows.length} ta mahsulotni qo'shish`}
        </button>
      </div>
    </Modal>
  );
}
