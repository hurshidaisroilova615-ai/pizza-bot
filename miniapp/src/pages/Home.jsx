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
import { useI18n } from "../i18n/LanguageContext";
import LanguageButton from "../components/LanguageButton";

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
  const { t } = useI18n();
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
      { key: "discounts", type: "discounts", icon: "fire", title: t("story.discounts"), products: discounted },
      { key: "new", type: "new", icon: "sparkle", title: t("story.new"), products: newest },
      { key: "top", type: "top", icon: "star", title: t("story.top"), products: topProducts },
    ];
    if (settings.loyaltyEnabled) {
      base.push({ key: "bonus", type: "bonus", icon: "gift", title: t("story.bonus"), balance: loyaltyBalance });
    }
    base.push({ key: "delivery", type: "delivery", icon: "truck", title: t("story.delivery") });

    // A customer's own offers sit after the standing ones so the row always
    // opens with the same five, however many campaigns are running.
    for (const offer of offers) {
      base.push({ key: `offer-${offer.id}`, type: "offer", icon: "tag", title: offer.title, offer });
    }
    return base;
  }, [discounted, newest, topProducts, loyaltyBalance, offers, settings.loyaltyEnabled, t]);

  return (
    <div>
      <div className="header">
        <div>
          <p className="header-greeting">{t("home.greeting")}</p>
          <h1 className="header-name">{firstName}</h1>
        </div>
        <div className="header-actions">
          <LanguageButton />
          <div className="header-avatar">
            <Icon name="user" size={22} />
          </div>
        </div>
      </div>

      <StoryBar stories={stories} onSelect={setActiveStory} />

      <ActiveOrderCard refreshKey={ordersRefreshKey} onOpenProfile={onOpenProfile} />

      <FeaturedHero products={popular} onOpen={setSelectedProduct} onBrowse={onOrderClick} />

      {discounted.length > 0 && (
        <>
          <p className="eyebrow eyebrow-page">{t("home.discountsEyebrow")}</p>
          <h2 className="section-title">{t("home.discounts")}</h2>
          <div className="product-grid">
            {discounted.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setSelectedProduct} onQuickAdd={onAdd} />
            ))}
          </div>
        </>
      )}

      {popular.length > 0 && (
        <>
          <p className="eyebrow eyebrow-page">{t("home.popularEyebrow")}</p>
          <div className="section-head">
            <h2 className="section-title">{t("home.popular")}</h2>
            <button className="section-link" onClick={onOrderClick}>
              {t("home.all")}
            </button>
          </div>
          <ProductRail products={popular} onOpen={setSelectedProduct} />
        </>
      )}

      {categories.length > 0 && (
        <>
          <p className="eyebrow eyebrow-page">{t("home.menuEyebrow")}</p>
          <h2 className="section-title">{t("home.categories")}</h2>
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
