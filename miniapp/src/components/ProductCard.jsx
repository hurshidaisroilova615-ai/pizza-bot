import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import Icon from "./Icon";
import { hapticFeedback } from "../telegram";

export default function ProductCard({ product, onOpen, onQuickAdd }) {
  const settings = useSettings();
  const soldOut = product.isAvailable === false;
  const [justAdded, setJustAdded] = useState(false);
  const discounted = product.oldPrice && product.oldPrice > product.price;

  return (
    <div className={`product-card ${soldOut ? "sold-out" : ""}`} onClick={() => onOpen(product)}>
      <img className="product-card-img" src={product.imageUrl} alt={product.name} loading="lazy" />

      {/* The card is the photograph. Everything else rides on top of it,
          over a scrim dark enough to carry white text on any picture a
          shop owner sends from their phone. */}
      <div className="product-card-scrim" />

      {discounted && <span className="product-flag">Chegirma</span>}
      {soldOut && <span className="sold-out-ribbon">Hozircha tugadi</span>}

      <div className="product-card-body">
        <p className="product-card-name">{product.name}</p>
        <div className="product-price-row">
          <span className="price-new">
            {product.price.toLocaleString()}
            <i>{settings.currency}</i>
          </span>
          {discounted && <span className="price-old">{product.oldPrice.toLocaleString()}</span>}
        </div>
      </div>

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
          <Icon name={justAdded ? "check" : "plus"} size={19} strokeWidth={2.6} />
        </button>
      )}
    </div>
  );
}
