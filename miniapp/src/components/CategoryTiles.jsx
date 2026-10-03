import { useI18n } from "../i18n/LanguageContext";
import Thumb from "./Thumb";

// Each category wears the photograph of one of its own dishes. A grid of
// grey boxes with words in them tells a customer nothing they can't read on
// the tab row; a grid of food tells them where to tap.
// A category with nothing in it is not a place to send anybody, so it gets
// no tile. Exported because the heading above the grid has to know whether
// there will be a grid — otherwise "Categories" sits over empty page.
export function categoryTiles(categories, products) {
  return categories
    .map((c) => {
      const mine = products.filter((p) => p.category?.name === c.name);
      const cover = mine.find((p) => p.isAvailable !== false) || mine[0];
      return { ...c, count: mine.length, cover };
    })
    .filter((tile) => tile.count > 0);
}

export default function CategoryTiles({ categories, products, onOpen }) {
  const { t } = useI18n();
  const tiles = categoryTiles(categories, products);

  if (tiles.length === 0) return null;

  return (
    <div className="category-grid">
      {tiles.map((tile) => (
        <button key={tile.id} className="category-tile" onClick={() => onOpen(tile.name)}>
          <Thumb src={tile.cover?.imageUrl} label={tile.name} />
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
