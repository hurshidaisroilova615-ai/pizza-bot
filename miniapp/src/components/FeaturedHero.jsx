import { useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n/LanguageContext";

// The first thing on the home screen, and the one place a dish is shown at
// the size the photograph deserves. A grid of thumbnails tells a customer
// what is on the menu; this tells them they are hungry.
export default function FeaturedHero({ products, onOpen, onBrowse }) {
  const settings = useSettings();
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  const picks = products.filter((p) => p.isAvailable !== false).slice(0, 5);

  useEffect(() => {
    if (picks.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % picks.length), 5000);
    return () => clearInterval(t);
  }, [picks.length]);

  if (picks.length === 0) return null;
  const dish = picks[Math.min(index, picks.length - 1)];

  return (
    <div className="featured">
      {/* Every pick stays mounted and cross-fades, so the panel never drops
          to an empty frame while the next photograph decodes. */}
      {picks.map((p, i) => (
        <img
          key={p.id}
          className={`featured-img ${i === index ? "on" : ""}`}
          src={p.imageUrl}
          alt=""
          aria-hidden="true"
        />
      ))}
      <div className="featured-scrim" />

      <div className="featured-body">
        <p className="eyebrow">{settings.businessName}</p>
        <h2 className="featured-title">{dish.name}</h2>
        <p className="featured-price">
          {dish.price.toLocaleString()} <i>{settings.currency}</i>
        </p>
        <div className="featured-actions">
          <button
            className="featured-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(dish);
            }}
          >
            {t("home.order")}
          </button>
          <button className="featured-btn ghost" onClick={onBrowse}>
            {t("home.wholeMenu")}
          </button>
        </div>
      </div>

      {picks.length > 1 && (
        <div className="featured-dots">
          {picks.map((p, i) => (
            <button
              key={p.id}
              className={`featured-dot ${i === index ? "on" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}-taom`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
