import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { useT } from "../i18n";

const LINKS = [
  { to: "/", label: "Statistika", icon: "📊", end: true },
  { to: "/orders", label: "Buyurtmalar", icon: "🧾" },
  { to: "/products", label: "Mahsulotlar", icon: "📦" },
  { to: "/categories", label: "Kategoriyalar", icon: "🗂" },
  { to: "/customers", label: "Mijozlar (CRM)", icon: "👥" },
  { to: "/promo-codes", label: "Promo kodlar", icon: "🏷" },
  { to: "/offers", label: "Maxsus takliflar", icon: "🎁" },
  { to: "/tables", label: "Stol QR kodlari", icon: "🍽" },
  { to: "/settings", label: "Sozlamalar", icon: "⚙️" },
];

export default function Sidebar({ businessName }) {
  const { t, lang, setLang } = useT();
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <WorkspaceSwitcher businessName={businessName} />
      <nav className="sidebar-nav">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span className="sidebar-icon">{link.icon}</span>
            {t(link.label)}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-lang" role="group" aria-label="Til / Язык">
        {[
          { code: "uz", label: t("O'zbekcha") },
          { code: "ru", label: t("Русский") },
        ].map((option) => (
          <button
            key={option.code}
            type="button"
            className={`sidebar-lang-btn ${lang === option.code ? "active" : ""}`}
            onClick={() => setLang(option.code)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button className="sidebar-logout" onClick={logout}>
        {t("Chiqish")}
      </button>
      <p className="sidebar-build" title={t("Shu nusxa qachon yig'ilgan")}>
        {t("Versiya")}: {__BUILD_TIME__}
      </p>
    </aside>
  );
}
