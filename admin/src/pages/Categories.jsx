import { useEffect, useState } from "react";
import { api } from "../api";
import CategoryModal from "../components/CategoryModal";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    api.getCategories().then(setCategories).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSave(form) {
    if (editing) await api.updateCategory(editing.id, form);
    else await api.createCategory(form);
    setModalOpen(false);
    load();
  }

  async function handleDelete(category) {
    if (!confirm(`"${category.name}" kategoriyasini o'chirmoqchimisiz?`)) return;
    await api.deleteCategory(category.id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Kategoriyalar</h1>
        <button
          className="btn btn-accent"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Yangi kategoriya
        </button>
      </div>

      {loading && <p className="empty-note">Yuklanmoqda...</p>}
      {!loading && categories.length === 0 && <p className="empty-note">Hozircha kategoriyalar yo'q</p>}

      {categories.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ikon</th>
                <th>Nomi</th>
                <th>Mahsulotlar soni</th>
                <th>Holati</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td data-label="Ikon" style={{ fontSize: 20 }}>{c.icon}</td>
                  <td data-label="Nomi">{c.name}</td>
                  <td data-label="Mahsulotlar">{c._count?.products ?? 0}</td>
                  <td data-label="Holati">
                    <span className={`status-pill ${c.isActive ? "done" : ""}`}>{c.isActive ? "Faol" : "Nofaol"}</span>
                  </td>
                  <td className="row-actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setEditing(c);
                        setModalOpen(true);
                      }}
                    >
                      Tahrirlash
                    </button>
                    <button className="btn btn-outline" onClick={() => handleDelete(c)}>
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && <CategoryModal category={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}
    </div>
  );
}
