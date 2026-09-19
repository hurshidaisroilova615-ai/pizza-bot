import { useSettings } from "../context/SettingsContext";

// A horizontal shelf. The grid is for browsing the whole menu; this is for
// the few dishes worth putting in front of someone the moment they open the
// app, without pushing everything else off the screen.
export default function ProductRail({ products, onOpen }) {
  const settings = useSettings();
  if (!products || products.length === 0) return null;

  return (
    <div className="rail">
      {products.map((p) => (
        <button key={p.id} className="rail-card" onClick={() => onOpen(p)}>
          <span className="rail-media">
            <img src={p.imageUrl} alt={p.name} loading="lazy" />
            {p.isAvailable === false && <span className="rail-soldout">Tugadi</span>}
          </span>
          <span className="rail-name">{p.name}</span>
          <span className="rail-price">
            {p.price.toLocaleString()} {settings.currency}
          </span>
        </button>
      ))}
    </div>
  );
}
