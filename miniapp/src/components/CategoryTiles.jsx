// Each category wears the photograph of one of its own dishes. A grid of
// grey boxes with words in them tells a customer nothing they can't read on
// the tab row; a grid of food tells them where to tap.
export default function CategoryTiles({ categories, products, onOpen }) {
  const tiles = categories
    .map((c) => {
      const mine = products.filter((p) => p.category?.name === c.name);
      const cover = mine.find((p) => p.isAvailable !== false) || mine[0];
      return { ...c, count: mine.length, cover };
    })
    .filter((t) => t.count > 0);

  if (tiles.length === 0) return null;

  return (
    <div className="category-grid">
      {tiles.map((t) => (
        <button key={t.id} className="category-tile" onClick={() => onOpen(t.name)}>
          {t.cover && <img src={t.cover.imageUrl} alt="" aria-hidden="true" />}
          <span className="category-scrim" />
          <span className="category-body">
            <span className="category-tile-name">{t.name}</span>
            <span className="category-tile-count">{t.count} ta taom</span>
          </span>
        </button>
      ))}
    </div>
  );
}
