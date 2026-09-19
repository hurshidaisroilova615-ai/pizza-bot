import { useState } from "react";
import { useSave } from "../lib/useSave";
import Modal from "./Modal";

export default function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState({
    name: category?.name || "",
    icon: category?.icon || "",
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
  });
  const { saving, error, save } = useSave();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await save(() => onSave({ ...form, sortOrder: Number(form.sortOrder) }));
  }

  return (
    <Modal title={category ? "Kategoriyani tahrirlash" : "Yangi kategoriya"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nomi</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Emoji / ikon</label>
          <input value={form.icon} onChange={(e) => update("icon", e.target.value)} placeholder="🍕" />
        </div>
        <div className="form-group">
          <label>Tartib raqami</label>
          <input type="number" value={form.sortOrder} onChange={(e) => update("sortOrder", e.target.value)} />
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
          Faol
        </label>
        {error && <p className="form-error save-error">{error}</p>}

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
