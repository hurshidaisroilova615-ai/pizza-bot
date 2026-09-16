import { useEffect, useState } from "react";
import StoryBar from "../components/StoryBar";
import { useSettings } from "../context/SettingsContext";
import { api } from "../api";

export default function Home({ firstName, onOrderClick }) {
  const settings = useSettings();
  const [offers, setOffers] = useState([]);
  const [activeOffer, setActiveOffer] = useState(null);

  useEffect(() => {
    api
      .getOffers()
      .then(setOffers)
      .catch(() => setOffers([]));
  }, []);

  return (
    <div>
      <div className="header">
        <div>
          <p className="header-greeting">Xush kelibsiz 👋</p>
          <h1 className="header-name">{firstName}</h1>
        </div>
        <div className="header-avatar">🙂</div>
      </div>

      <StoryBar offers={offers} onSelectOffer={setActiveOffer} />

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

      {activeOffer && (
        <div className="sheet-overlay" onClick={() => setActiveOffer(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-body">
              <h2 className="sheet-title">{activeOffer.title}</h2>
              <p className="sheet-desc">{activeOffer.message}</p>
              {activeOffer.promoCode && (
                <div className="promo-highlight">Promo kod: {activeOffer.promoCode.code}</div>
              )}
            </div>
            <div className="sheet-cta">
              <button className="btn-primary" onClick={() => setActiveOffer(null)}>
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
