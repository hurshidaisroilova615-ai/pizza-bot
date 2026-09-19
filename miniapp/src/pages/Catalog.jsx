import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductSheet from "../components/ProductSheet";
import { api } from "../api";
import ProductSkeleton from "../components/ProductSkeleton";
import Icon from "../components/Icon";

const ALL = "Barchasi";

export default function Catalog({ products, onAdd, initialCategory }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(initialCategory || ALL);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Arriving from a category tile on the home screen.
  useEffect(() => {
    if (initialCategory) setActiveCategory(initialCategory);
  }, [initialCategory]);

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

      {products.length === 0 && <ProductSkeleton />}

      {products.length > 0 && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-emoji">
            <Icon name="search" size={30} strokeWidth={1.5} />
          </div>
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
