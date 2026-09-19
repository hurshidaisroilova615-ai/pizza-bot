import { useSettings } from "../context/SettingsContext";

export default function ProductCard({ product, onOpen, onQuickAdd }) {
  const settings = useSettings();

  const soldOut = product.isAvailable === false;

  return (
    <div className={`product-card ${soldOut ? "sold-out" : ""}`} onClick={() => onOpen(product)}>
      <div className="product-card-media">
        <img className="product-card-img" src={product.imageUrl} alt={product.name} loading="lazy" />
        {soldOut && <span className="sold-out-ribbon">Hozircha tugadi</span>}
      </div>
      {/* A greyed-out plus invites a tap that does nothing; a sold-out dish
          simply offers no button, and the ribbon explains why. */}
      {!soldOut && (
        <button
          className="add-btn"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(product);
          }}
          aria-label={`${product.name} savatchaga qo'shish`}
        >
          +
        </button>
      )}
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
