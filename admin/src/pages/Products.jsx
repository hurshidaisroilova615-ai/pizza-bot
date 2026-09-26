import { useEffect, useState } from "react";
import { api } from "../api";
import ProductModal from "../components/ProductModal";
import BulkImportModal from "../components/BulkImportModal";
import ClearCatalogModal from "../components/ClearCatalogModal";
import { useT } from "../i18n";

export default function Products() {
  const { t } = useT();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([api.getProducts(), api.getCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function handleSave(form) {
    if (editingProduct) {
      await api.updateProduct(editingProduct.id, form);
    } else {
      await api.createProduct(form);
    }
    setModalOpen(false);
    load();
  }

  // Optimistic: the owner taps this while serving customers, so the row has
  // to flip instantly. A failure puts the old value back and says why.
  async function toggleAvailability(product) {
    const next = !product.isAvailable;
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isAvailable: next } : p)));
    try {
      const updated = await api.setProductAvailability(product.id, next);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: product.isAvailable } : p))
      );
      alert(t("O'zgartirib bo'lmadi: {message}", { message: err.message }));
    }
  }

  async function handleDelete(product) {
    if (!confirm(t("«{name}» mahsulotini o'chirmoqchimisiz?", { name: product.name }))) return;
    await api.deleteProduct(product.id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t("Mahsulotlar")}</h1>
        <div className="header-actions">
          {products.length > 0 && (
            <button className="btn btn-outline btn-danger" onClick={() => setClearOpen(true)}>
              {t("Katalogni tozalash")}
            </button>
          )}
          <button className="btn btn-outline" onClick={() => setBulkOpen(true)}>
            {t("📋 Menyuni ro'yxat bilan qo'shish")}
          </button>
          <button className="btn btn-accent" onClick={openCreate}>
            {t("+ Yangi mahsulot")}
          </button>
        </div>
      </div>

      {loading && <p className="empty-note">{t("Yuklanmoqda...")}</p>}
      {!loading && products.length === 0 && <p className="empty-note">{t("Hozircha mahsulotlar yo'q")}</p>}

      {products.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>{t("Nomi")}</th>
                <th>{t("Kategoriya")}</th>
                <th>{t("Eski narx")}</th>
                <th>{t("Narx")}</th>
                <th>{t("Holati")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className={product.isAvailable ? "" : "row-muted"}>
                  <td data-label={t("Rasm")}>
                    <img className="thumb" src={product.imageUrl} alt={product.name} />
                  </td>
                  <td data-label={t("Nomi")}>{product.name}</td>
                  <td data-label={t("Kategoriya")}>{product.category?.name || "—"}</td>
                  <td data-label={t("Eski narx")}>{product.oldPrice ? product.oldPrice.toLocaleString() : "—"}</td>
                  <td data-label={t("Narx")}>{product.price.toLocaleString()}</td>
                  <td data-label={t("Holati")}>
                    <button
                      className={`stock-toggle ${product.isAvailable ? "in-stock" : "out-of-stock"}`}
                      onClick={() => toggleAvailability(product)}
                      title={
                        product.isAvailable
                          ? t("Bosing — «Tugadi» qilib qo'yiladi")
                          : t("Bosing — yana sotuvga qaytadi")
                      }
                    >
                      {product.isAvailable ? t("✅ Bor") : t("🚫 Tugadi")}
                    </button>
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-outline" onClick={() => openEdit(product)}>
                      {t("Tahrirlash")}
                    </button>
                    <button className="btn btn-outline" onClick={() => handleDelete(product)}>
                      {t("O'chirish")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bulkOpen && <BulkImportModal onClose={() => setBulkOpen(false)} onImported={load} />}

      {clearOpen && (
        <ClearCatalogModal
          productCount={products.length}
          categoryCount={categories.length}
          onClose={() => setClearOpen(false)}
          onCleared={load}
        />
      )}

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          allProducts={products}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
