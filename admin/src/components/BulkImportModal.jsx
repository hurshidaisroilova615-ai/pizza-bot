import { useMemo, useState } from "react";
import Modal from "./Modal";
import { api } from "../api";
import { parseMenu } from "../lib/parseMenu";

const EXAMPLE = `Pitsalar
Margarita 45 000
Pepperoni 55 000

Ichimliklar
Kola 0.5L 12000
Choy 5000`;

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
        Menyuni bor holicha qo'ying — har bir taom alohida qatorda, narxi qator oxirida. Narxsiz
        qator kategoriya deb olinadi va undan keyingi taomlar shu kategoriyaga tushadi. Yo'q
        kategoriyalar o'zi yaratiladi.
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
