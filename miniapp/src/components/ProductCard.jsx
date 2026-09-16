import { useSettings } from "../context/SettingsContext";

export default function ProductCard({ product, onOpen, onQuickAdd }) {
  const settings = useSettings();

  return (
    <div className="product-card" onClick={() => onOpen(product)}>
      <img className="product-card-img" src={product.imageUrl} alt={product.name} loading="lazy" />
      {!product.isAvailable && <div className="product-unavailable-badge">Mavjud emas</div>}
      <button
        className="add-btn"
        disabled={!product.isAvailable}
        onClick={(e) => {
          e.stopPropagation();
          onQuickAdd(product);
        }}
        aria-label={`${product.name} savatchaga qo'shish`}
      >
        +
      </button>
      <div className="product-card-body">
        <p className="product-card-name">{product.name}</p>
        <div className="product-price-row">
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="price-old">
              {product.oldPrice.toLocaleString()} {settings.currency}
            </span>
          )}
          <span className="price-new">
            {product.price.toLocaleString()} {settings.currency}
          </span>
        </div>
      </div>
    </div>
  );
}
