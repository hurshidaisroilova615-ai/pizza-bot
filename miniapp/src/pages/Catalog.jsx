import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductSheet from "../components/ProductSheet";
import { api } from "../api";

const ALL = "Barchasi";

export default function Catalog({ products, onAdd }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    api
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const tabs = useMemo(() => [ALL, ...categories.map((c) => c.name)], [categories]);

  const filtered =
    activeCategory === ALL ? products : products.filter((p) => p.category?.name === activeCategory);

  return (
    <div>
      <h1 className="page-title">Katalog</h1>

      <div className="tag-row">
        {tabs.map((cat) => (
          <button
            key={cat}
            className={`tag ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-emoji">🔍</div>
          <p>Bu kategoriyada mahsulot topilmadi</p>
        </div>
      )}

      <div className="product-grid">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} onQuickAdd={onAdd} />
        ))}
      </div>

      <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={onAdd} />
    </div>
  );
}
