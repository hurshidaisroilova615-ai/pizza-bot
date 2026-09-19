import ProductCard from "./ProductCard";
import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n/LanguageContext";

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
  const { t } = useI18n();
  if (!story) return null;

  const money = (n) => `${n.toLocaleString()} ${settings.currency}`;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <h2 className="sheet-title">{story.title}</h2>

          {story.type === "discounts" && (
            <>
              <p className="sheet-desc">{t("sheet.discountsDesc")}</p>
              <ProductList
                products={story.products}
                emptyText={t("sheet.discountsEmpty")}
                onOpenProduct={onOpenProduct}
                onAdd={onAdd}
              />
            </>
          )}

          {story.type === "new" && (
            <>
              <p className="sheet-desc">{t("sheet.newDesc")}</p>
              <ProductList
                products={story.products}
                emptyText={t("sheet.newEmpty")}
                onOpenProduct={onOpenProduct}
                onAdd={onAdd}
              />
            </>
          )}

          {story.type === "top" && (
            <>
              <p className="sheet-desc">{t("sheet.topDesc")}</p>
              <ProductList
                products={story.products}
                emptyText={t("sheet.topEmpty")}
                onOpenProduct={onOpenProduct}
                onAdd={onAdd}
              />
            </>
          )}

          {story.type === "bonus" && (
            <div className="info-block">
              <div className="info-hero">
                <span className="info-hero-value">{story.balance}</span>
                <span className="info-hero-label">{t("sheet.bonusLabel")}</span>
              </div>
              <ul className="info-list">
                <li>{t("sheet.bonusEarn", { percent: Math.round(settings.loyaltyEarnRate * 100) })}</li>
                <li>{t("sheet.bonusValue", { value: money(settings.loyaltyPointValue) })}</li>
                <li>{t("sheet.bonusUse")}</li>
                <li>{t("sheet.bonusForever")}</li>
              </ul>
            </div>
          )}

          {story.type === "delivery" && (
            <div className="info-block">
              <ul className="info-list">
                <li>
                  {t("sheet.deliveryFee", {
                    fee: settings.deliveryFee > 0 ? money(settings.deliveryFee) : t("sheet.deliveryFree"),
                  })}
                </li>
                {settings.freeDeliveryThreshold > 0 && (
                  <li>{t("sheet.deliveryThreshold", { amount: money(settings.freeDeliveryThreshold) })}</li>
                )}
                {settings.minOrderAmount > 0 && (
                  <li>{t("sheet.minOrder", { amount: money(settings.minOrderAmount) })}</li>
                )}
                <li>{t("sheet.trackOrder")}</li>
                {settings.supportPhone && <li>{t("sheet.contact", { phone: settings.supportPhone })}</li>}
              </ul>
            </div>
          )}

          {story.type === "offer" && (
            <>
              <p className="sheet-desc">{story.offer.message}</p>
              {story.offer.promoCode && (
                <div className="promo-highlight">
                  {t("sheet.promoCode", { code: story.offer.promoCode.code })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="sheet-cta">
          <button className="btn-primary" onClick={onClose}>
            {t("sheet.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
