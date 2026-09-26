import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

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
            {link.label}
          </NavLink>
        ))}
      </nav>
      <button className="sidebar-logout" onClick={logout}>
        Chiqish
      </button>
      <p className="sidebar-build" title="Shu nusxa qachon yig'ilgan">
        Versiya: {__BUILD_TIME__}
      </p>
    </aside>
  );
}
