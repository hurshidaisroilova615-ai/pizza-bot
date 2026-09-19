import { useSettings } from "../context/SettingsContext";

export default function ProductSheet({ product, onClose, onAdd }) {
  const settings = useSettings();
  if (!product) return null;

  const ingredients = product.description
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const recommended = (product.recommendedProducts || []).filter((p) => p.isAvailable !== false);
  const soldOut = product.isAvailable === false;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className={`sheet-media ${soldOut ? "sold-out" : ""}`}>
          <img className="sheet-img" src={product.imageUrl} alt={product.name} />
          {soldOut && <span className="sold-out-ribbon">Hozircha tugadi</span>}
        </div>
        <div className="sheet-body">
          <h2 className="sheet-title">{product.name}</h2>
          {ingredients.length > 0 && (
            <ul className="ingredient-list">
              {ingredients.map((ing) => (
                <li key={ing}>
                  <span className="ingredient-dot" />
                  {ing}
                </li>
              ))}
            </ul>
          )}

          {recommended.length > 0 && (
            <div className="upsell-section">
              <p className="upsell-heading">Bunga mos qo'shimchalar</p>
              <div className="upsell-scroll">
                {recommended.map((rp) => (
                  <button key={rp.id} className="upsell-card" onClick={() => onAdd(rp)}>
                    <img src={rp.imageUrl} alt={rp.name} />
                    <span className="upsell-card-name">{rp.name}</span>
                    <span className="upsell-card-price">
                      +{rp.price.toLocaleString()} {settings.currency}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="sheet-cta">
          <button
            className="btn-primary"
            disabled={soldOut}
            onClick={() => {
              onAdd(product);
              onClose();
            }}
          >
            {soldOut
              ? "Hozircha tugadi"
              : `Savatchaga qo'shish — ${product.price.toLocaleString()} ${settings.currency}`}
          </button>
        </div>
      </div>
    </div>
  );
}
