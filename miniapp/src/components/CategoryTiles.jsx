import { useI18n } from "../i18n/LanguageContext";

// Each category wears the photograph of one of its own dishes. A grid of
// grey boxes with words in them tells a customer nothing they can't read on
// the tab row; a grid of food tells them where to tap.
export default function CategoryTiles({ categories, products, onOpen }) {
  const { t } = useI18n();
  const tiles = categories
    .map((c) => {
      const mine = products.filter((p) => p.category?.name === c.name);
      const cover = mine.find((p) => p.isAvailable !== false) || mine[0];
      return { ...c, count: mine.length, cover };
    })
    .filter((tile) => tile.count > 0);

  if (tiles.length === 0) return null;

  return (
    <div className="category-grid">
      {tiles.map((tile) => (
        <button key={tile.id} className="category-tile" onClick={() => onOpen(tile.name)}>
          {tile.cover && <img src={tile.cover.imageUrl} alt="" aria-hidden="true" />}
          <span className="category-scrim" />
          <span className="category-body">
            <span className="category-tile-name">{tile.name}</span>
            <span className="category-tile-count">{t("home.dishCount", { count: tile.count })}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
