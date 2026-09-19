import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import Icon from "./Icon";
import { hapticFeedback } from "../telegram";

export default function ProductCard({ product, onOpen, onQuickAdd }) {
  const settings = useSettings();

  const soldOut = product.isAvailable === false;
  const [justAdded, setJustAdded] = useState(false);

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
          className={`add-btn ${justAdded ? "added" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback("light");
            onQuickAdd(product);
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 900);
          }}
          aria-label={`${product.name} savatchaga qo'shish`}
        >
          <Icon name={justAdded ? "check" : "plus"} size={17} strokeWidth={2.6} />
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
