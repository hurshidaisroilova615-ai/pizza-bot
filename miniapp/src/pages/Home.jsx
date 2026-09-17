import { useEffect, useMemo, useState } from "react";
import StoryBar from "../components/StoryBar";
import StorySheet from "../components/StorySheet";
import ProductSheet from "../components/ProductSheet";
import ProductCard from "../components/ProductCard";
import { useSettings } from "../context/SettingsContext";
import { api } from "../api";

export default function Home({ firstName, products, onAdd, onOrderClick }) {
  const settings = useSettings();
  const [offers, setOffers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [activeStory, setActiveStory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    api.getOffers().then(setOffers).catch(() => setOffers([]));
    api.getTopProducts().then(setTopProducts).catch(() => setTopProducts([]));
    api
      .getLoyalty()
      .then((l) => setLoyaltyBalance(l?.balance || 0))
      .catch(() => setLoyaltyBalance(0));
  }, []);

  const discounted = useMemo(
    () => products.filter((p) => p.oldPrice && p.oldPrice > p.price),
    [products]
  );

  const newest = useMemo(
    () => [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [products]
  );

  const stories = useMemo(() => {
    const base = [
      { key: "discounts", type: "discounts", emoji: "🔥", title: "Aksiyalar", products: discounted },
      { key: "new", type: "new", emoji: "🆕", title: "Yangi", products: newest },
      { key: "top", type: "top", emoji: "⭐️", title: "Top", products: topProducts },
    ];
    if (settings.loyaltyEnabled) {
      base.push({ key: "bonus", type: "bonus", emoji: "🎁", title: "Bonus", balance: loyaltyBalance });
    }
    base.push({ key: "delivery", type: "delivery", emoji: "🚚", title: "Yetkazish" });

    // A customer's own offers sit after the standing ones so the row always
    // opens with the same five, however many campaigns are running.
    for (const offer of offers) {
      base.push({ key: `offer-${offer.id}`, type: "offer", emoji: "🎉", title: offer.title, offer });
    }
    return base;
  }, [discounted, newest, topProducts, loyaltyBalance, offers, settings.loyaltyEnabled]);

  return (
    <div>
      <div className="header">
        <div>
          <p className="header-greeting">Xush kelibsiz 👋</p>
          <h1 className="header-name">{firstName}</h1>
        </div>
        <div className="header-avatar">🙂</div>
      </div>

      <StoryBar stories={stories} onSelect={setActiveStory} />

      <div className="hero" style={{ background: `linear-gradient(135deg, #1c1c1f, ${settings.primaryColor}22)` }}>
        <span className="hero-emoji">🛍</span>
        <h2 className="hero-title">
          {settings.businessName}
          <br />
          bugun nima buyurtma qilamiz?
        </h2>
        <p className="hero-subtitle">{settings.aboutText || "Eng mazali takliflar tez orada eshigingiz oldida"}</p>
        <button className="hero-btn" onClick={onOrderClick}>
          Yangi buyurtma berish
        </button>
      </div>

      {discounted.length > 0 && (
        <>
          <h2 className="section-title">🔥 Bugungi aksiyalar</h2>
          <div className="product-grid">
            {discounted.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setSelectedProduct} onQuickAdd={onAdd} />
            ))}
          </div>
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
