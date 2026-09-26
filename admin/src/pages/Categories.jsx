import { useEffect, useState } from "react";
import { api } from "../api";
import CategoryModal from "../components/CategoryModal";
import { useT } from "../i18n";

export default function Categories() {
  const { t } = useT();
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
        <h1>{t("Kategoriyalar")}</h1>
        <button
          className="btn btn-accent"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          {t("+ Yangi kategoriya")}
        </button>
      </div>

      {loading && <p className="empty-note">{t("Yuklanmoqda...")}</p>}
      {!loading && categories.length === 0 && <p className="empty-note">{t("Hozircha kategoriyalar yo'q")}</p>}

      {categories.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Ikon")}</th>
                <th>{t("Nomi")}</th>
                <th>{t("Mahsulotlar soni")}</th>
                <th>{t("Holati")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td data-label={t("Ikon")} style={{ fontSize: 20 }}>{c.icon}</td>
                  <td data-label={t("Nomi")}>{c.name}</td>
                  <td data-label={t("Mahsulotlar")}>{c._count?.products ?? 0}</td>
                  <td data-label={t("Holati")}>
                    <span className={`status-pill ${c.isActive ? "done" : ""}`}>{c.isActive ? t("Faol") : t("Nofaol")}</span>
                  </td>
                  <td className="row-actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setEditing(c);
                        setModalOpen(true);
                      }}
                    >
                      {t("Tahrirlash")}
                    </button>
                    <button className="btn btn-outline" onClick={() => handleDelete(c)}>
                      {t("O'chirish")}
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
