import { useEffect, useState } from "react";
import { api } from "../api";
import ProductModal from "../components/ProductModal";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
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

  async function handleDelete(product) {
    if (!confirm(`"${product.name}" mahsulotini o'chirmoqchimisiz?`)) return;
    await api.deleteProduct(product.id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Mahsulotlar</h1>
        <button className="btn btn-accent" onClick={openCreate}>
          + Yangi mahsulot qo'shish
        </button>
      </div>

      {loading && <p className="empty-note">Yuklanmoqda...</p>}
      {!loading && products.length === 0 && <p className="empty-note">Hozircha mahsulotlar yo'q</p>}

      {products.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Nomi</th>
                <th>Kategoriya</th>
                <th>Eski narx</th>
                <th>Narx</th>
                <th>Holati</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img className="thumb" src={product.imageUrl} alt={product.name} />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category?.name || "—"}</td>
                  <td>{product.oldPrice ? product.oldPrice.toLocaleString() : "—"}</td>
                  <td>{product.price.toLocaleString()}</td>
                  <td>
                    <span className={`status-pill ${product.isAvailable ? "done" : ""}`}>
                      {product.isAvailable ? "Mavjud" : "Mavjud emas"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-outline" onClick={() => openEdit(product)}>
                      Tahrirlash
                    </button>
                    <button className="btn btn-outline" onClick={() => handleDelete(product)}>
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
