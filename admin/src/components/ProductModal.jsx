import { useState } from "react";
import Modal from "./Modal";

export default function ProductModal({ product, categories, allProducts, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    imageUrl: product?.imageUrl || "",
    price: product?.price ?? "",
    oldPrice: product?.oldPrice ?? "",
    categoryId: product?.categoryId ?? "",
    isAvailable: product?.isAvailable ?? true,
    isRecommended: product?.isRecommended ?? false,
    recommendedProductIds: product?.recommendedProducts?.map((p) => p.id) || [],
  });
  const [saving, setSaving] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleRecommended(id) {
    setForm((f) => ({
      ...f,
      recommendedProductIds: f.recommendedProductIds.includes(id)
        ? f.recommendedProductIds.filter((rid) => rid !== id)
        : [...f.recommendedProductIds, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        price: Number(form.price),
        oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
        categoryId: form.categoryId === "" ? null : Number(form.categoryId),
      });
    } finally {
      setSaving(false);
    }
  }

  const otherProducts = (allProducts || []).filter((p) => p.id !== product?.id);

  return (
    <Modal title={product ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nomi</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Tarkibi / tavsif (vergul bilan ajrating)</label>
          <textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="form-group">
          <label>Rasm URL</label>
          <input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Kategoriya</label>
            <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)}>
              <option value="">Tanlanmagan</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Eski narx</label>
            <input type="number" value={form.oldPrice} onChange={(e) => update("oldPrice", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Narx</label>
            <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} required />
          </div>
        </div>

        <div className="form-row">
          <label className="checkbox-row">
            <input type="checkbox" checked={form.isAvailable} onChange={(e) => update("isAvailable", e.target.checked)} />
            Mavjud
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.isRecommended}
              onChange={(e) => update("isRecommended", e.target.checked)}
            />
            Tavsiya etilgan qo'shimcha (upsell)
          </label>
        </div>

        <div className="form-group">
          <label>Bunga mos qo'shimchalar (cross-sell)</label>
          <div className="chip-select">
            {otherProducts.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`chip ${form.recommendedProductIds.includes(p.id) ? "active" : ""}`}
                onClick={() => toggleRecommended(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

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
