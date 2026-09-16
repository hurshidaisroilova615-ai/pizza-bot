const TABS = [
  { key: "home", icon: "🏠", label: "Bosh sahifa" },
  { key: "catalog", icon: "🔍", label: "Katalog" },
  { key: "cart", icon: "🛒", label: "Savatcha" },
  { key: "profile", icon: "👤", label: "Profil" },
];

export default function BottomNav({ active, onChange, cartCount }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`nav-item ${active === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.key === "cart" && cartCount > 0 && (
            <span className="nav-badge">{cartCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
