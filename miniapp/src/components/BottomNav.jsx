import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { hapticFeedback } from "../telegram";
import { useI18n } from "../i18n/LanguageContext";

const TABS = [
  { key: "home", icon: "home", label: "nav.home" },
  { key: "catalog", icon: "search", label: "nav.catalog" },
  { key: "cart", icon: "cart", label: "nav.cart" },
  { key: "profile", icon: "user", label: "nav.profile" },
];

export default function BottomNav({ active, onChange, cartCount }) {
  const { t } = useI18n();
  // The badge pops when the count goes up, so adding a dish from anywhere in
  // the app has a visible landing point.
  const [bumping, setBumping] = useState(false);
  const previous = useRef(cartCount);

  useEffect(() => {
    if (cartCount > previous.current) {
      setBumping(true);
      const t = setTimeout(() => setBumping(false), 420);
      previous.current = cartCount;
      return () => clearTimeout(t);
    }
    previous.current = cartCount;
  }, [cartCount]);

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`nav-item ${active === tab.key ? "active" : ""}`}
          onClick={() => {
            if (active !== tab.key) hapticFeedback("light");
            onChange(tab.key);
          }}
        >
          <span className="nav-icon">
            <Icon name={tab.icon} size={23} strokeWidth={active === tab.key ? 2.1 : 1.7} />
          </span>
          <span className="nav-label">{t(tab.label)}</span>
          {tab.key === "cart" && cartCount > 0 && (
            <span className={`nav-badge ${bumping ? "bump" : ""}`}>{cartCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
