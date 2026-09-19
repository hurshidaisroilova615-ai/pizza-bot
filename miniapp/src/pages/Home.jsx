import { useEffect, useMemo, useState } from "react";
import StoryBar from "../components/StoryBar";
import StorySheet from "../components/StorySheet";
import ProductSheet from "../components/ProductSheet";
import ProductCard from "../components/ProductCard";
import { useSettings } from "../context/SettingsContext";
import { api } from "../api";
import Icon from "../components/Icon";
import ActiveOrderCard from "../components/ActiveOrderCard";
import ProductRail from "../components/ProductRail";
import FeaturedHero from "../components/FeaturedHero";
import CategoryTiles from "../components/CategoryTiles";

export default function Home({
  firstName,
  products,
  onAdd,
  onOrderClick,
  onOpenCategory,
  onOpenProfile,
  ordersRefreshKey,
}) {
  const settings = useSettings();
  const [offers, setOffers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [activeStory, setActiveStory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getOffers().then(setOffers).catch(() => setOffers([]));
    api.getTopProducts().then(setTopProducts).catch(() => setTopProducts([]));
    api
      .getLoyalty()
      .then((l) => setLoyaltyBalance(l?.balance || 0))
      .catch(() => setLoyaltyBalance(0));
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const discounted = useMemo(
    () => products.filter((p) => p.oldPrice && p.oldPrice > p.price),
    [products]
  );

  const newest = useMemo(
    () => [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [products]
  );

  // Real order counts lead, and the rest of the menu fills the shelf behind
  // them — a shop with two orders to its name still gets a full row.
  const popular = useMemo(() => {
    const seen = new Set(topProducts.map((p) => p.id));
    const filler = products.filter((p) => p.isAvailable !== false && !seen.has(p.id));
    return [...topProducts, ...filler].slice(0, 8);
  }, [topProducts, products]);

  const stories = useMemo(() => {
    const base = [
      { key: "discounts", type: "discounts", icon: "fire", emoji: "🔥", title: "Aksiyalar", products: discounted },
      { key: "new", type: "new", icon: "sparkle", emoji: "🆕", title: "Yangi", products: newest },
      { key: "top", type: "top", icon: "star", emoji: "⭐️", title: "Top", products: topProducts },
    ];
    if (settings.loyaltyEnabled) {
      base.push({ key: "bonus", type: "bonus", icon: "gift", emoji: "🎁", title: "Bonus", balance: loyaltyBalance });
    }
    base.push({ key: "delivery", type: "delivery", icon: "truck", emoji: "🚚", title: "Yetkazish" });

    // A customer's own offers sit after the standing ones so the row always
    // opens with the same five, however many campaigns are running.
    for (const offer of offers) {
      base.push({ key: `offer-${offer.id}`, type: "offer", icon: "tag", emoji: "🎉", title: offer.title, offer });
    }
    return base;
  }, [discounted, newest, topProducts, loyaltyBalance, offers, settings.loyaltyEnabled]);

  return (
    <div>
      <div className="header">
        <div>
          <p className="header-greeting">Xush kelibsiz</p>
          <h1 className="header-name">{firstName}</h1>
        </div>
        <div className="header-avatar">
          <Icon name="user" size={22} />
        </div>
      </div>

      <StoryBar stories={stories} onSelect={setActiveStory} />

      <ActiveOrderCard refreshKey={ordersRefreshKey} onOpenProfile={onOpenProfile} />

      <FeaturedHero products={popular} onOpen={setSelectedProduct} onBrowse={onOrderClick} />

      {discounted.length > 0 && (
        <>
          <p className="eyebrow eyebrow-page">Arzonlashdi</p>
          <h2 className="section-title">Bugungi aksiyalar</h2>
          <div className="product-grid">
            {discounted.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setSelectedProduct} onQuickAdd={onAdd} />
            ))}
          </div>
        </>
      )}

      {popular.length > 0 && (
        <>
          <p className="eyebrow eyebrow-page">Mijozlar tanlovi</p>
          <div className="section-head">
            <h2 className="section-title">Ko'p buyurtma qilinadi</h2>
            <button className="section-link" onClick={onOrderClick}>
              Barchasi
            </button>
          </div>
          <ProductRail products={popular} onOpen={setSelectedProduct} />
        </>
      )}

      {categories.length > 0 && (
        <>
          <p className="eyebrow eyebrow-page">Menyu</p>
          <h2 className="section-title">Kategoriyalar</h2>
          <CategoryTiles categories={categories} products={products} onOpen={onOpenCategory} />
        </>
      )}

      <StorySheet
        story={activeStory}
        onClose={() => setActiveStory(null)}
        onOpenProduct={(p) => {
          setActiveStory(null);
          setSelectedProduct(p);
        }}
        onAdd={onAdd}
      />

      <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={onAdd} />
    </div>
  );
}
