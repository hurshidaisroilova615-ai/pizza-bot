import { useSettings } from "../context/SettingsContext";

// A horizontal shelf, built from the same photo-first card as the grid so
// the two read as one catalogue rather than two widgets.
export default function ProductRail({ products, onOpen }) {
  const settings = useSettings();
  if (!products || products.length === 0) return null;

  return (
    <div className="rail">
      {products.map((p) => {
        const soldOut = p.isAvailable === false;
        return (
          <button
            key={p.id}
            className={`rail-card ${soldOut ? "sold-out" : ""}`}
            onClick={() => onOpen(p)}
          >
            <img src={p.imageUrl} alt="" aria-hidden="true" />
            <span className="rail-scrim" />
            {soldOut && <span className="sold-out-ribbon">Tugadi</span>}
            <span className="rail-body">
              <span className="rail-name">{p.name}</span>
              <span className="rail-price">
                {p.price.toLocaleString()}
                <i>{settings.currency}</i>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
