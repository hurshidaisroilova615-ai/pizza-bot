import ProductCard from "./ProductCard";
import { useSettings } from "../context/SettingsContext";

function ProductList({ products, emptyText, onOpenProduct, onAdd }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-emoji">🙈</div>
        <p>{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="product-grid" style={{ padding: 0 }}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onOpen={onOpenProduct} onQuickAdd={onAdd} />
      ))}
    </div>
  );
}

export default function StorySheet({ story, onClose, onOpenProduct, onAdd }) {
  const settings = useSettings();
  if (!story) return null;

  const money = (n) => `${n.toLocaleString()} ${settings.currency}`;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <h2 className="sheet-title">
            {story.emoji} {story.title}
          </h2>

          {story.type === "discounts" && (
            <>
              <p className="sheet-desc">Bugungi chegirmalar — narxi tushirilgan mahsulotlar.</p>
              <ProductList
                products={story.products}
                emptyText="Hozircha chegirma yo'q"
                onOpenProduct={onOpenProduct}
                onAdd={onAdd}
              />
            </>
          )}

          {story.type === "new" && (
            <>
              <p className="sheet-desc">Menyuga eng oxirgi qo'shilganlar.</p>
              <ProductList
                products={story.products}
                emptyText="Yangi mahsulot yo'q"
                onOpenProduct={onOpenProduct}
                onAdd={onAdd}
              />
            </>
          )}

          {story.type === "top" && (
            <>
              <p className="sheet-desc">Mijozlar eng ko'p buyurtma qilgan mahsulotlar.</p>
              <ProductList
                products={story.products}
                emptyText="Hali yetarli buyurtma yo'q"
                onOpenProduct={onOpenProduct}
                onAdd={onAdd}
              />
            </>
          )}

          {story.type === "bonus" && (
            <div className="info-block">
              <div className="info-hero">
                <span className="info-hero-value">{story.balance}</span>
                <span className="info-hero-label">bonus ball</span>
              </div>
              <ul className="info-list">
                <li>
                  Har bir buyurtmadan <strong>{Math.round(settings.loyaltyEarnRate * 100)}%</strong> ball
                  qaytadi
                </li>
                <li>
                  1 ball = <strong>{money(settings.loyaltyPointValue)}</strong>
                </li>
                <li>Ballarni savatda keyingi buyurtmaga ishlatasiz</li>
                <li>Ball muddatsiz — yonib ketmaydi</li>
              </ul>
            </div>
          )}

          {story.type === "delivery" && (
            <div className="info-block">
              <ul className="info-list">
                <li>
                  Yetkazib berish: <strong>{settings.deliveryFee > 0 ? money(settings.deliveryFee) : "bepul"}</strong>
                </li>
                {settings.freeDeliveryThreshold && (
                  <li>
                    <strong>{money(settings.freeDeliveryThreshold)}</strong> dan yuqori buyurtmaga yetkazish
                    bepul
                  </li>
                )}
                {settings.minOrderAmount > 0 && (
                  <li>
                    Minimal buyurtma: <strong>{money(settings.minOrderAmount)}</strong>
                  </li>
                )}
                <li>Buyurtma holatini botdan kuzatib borasiz</li>
                {settings.supportPhone && (
                  <li>
                    Aloqa: <strong>{settings.supportPhone}</strong>
                  </li>
                )}
              </ul>
            </div>
          )}

          {story.type === "offer" && (
            <>
              <p className="sheet-desc">{story.offer.message}</p>
              {story.offer.promoCode && (
                <div className="promo-highlight">Promo kod: {story.offer.promoCode.code}</div>
              )}
            </>
          )}
        </div>

        <div className="sheet-cta">
          <button className="btn-primary" onClick={onClose}>
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
