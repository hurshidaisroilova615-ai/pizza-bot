import { useEffect, useState } from "react";
import Onboarding from "./components/Onboarding";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import { CartProvider, useCart } from "./context/CartContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { SettingsProvider, useSettings, useSettingsStatus } from "./context/SettingsContext";
import WakeScreen from "./components/WakeScreen";
import ClosedBanner from "./components/ClosedBanner";
import SiteFooter from "./components/SiteFooter";
import { api } from "./api";
import { initTelegram, watchColorScheme } from "./telegram";
import { currentCustomer, isTelegram } from "./identity";

function AppContent({ customer }) {
  const [tab, setTab] = useState("home");
  const [products, setProducts] = useState([]);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  // Set when the customer taps a category on the home screen, so the catalog
  // opens already filtered instead of on "Barchasi".
  const [catalogCategory, setCatalogCategory] = useState(null);
  const { addItem, totalCount } = useCart();

  useEffect(() => {
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  return (
    <div className="app-shell">
      <ClosedBanner />

      {tab === "home" && (
        <Home
          firstName={customer.firstName}
          products={products}
          onAdd={addItem}
          onOrderClick={() => setTab("catalog")}
          onOpenCategory={(name) => {
            setCatalogCategory(name);
            setTab("catalog");
          }}
          onOpenProfile={() => setTab("profile")}
          ordersRefreshKey={ordersRefreshKey}
        />
      )}
      {tab === "catalog" && (
        <Catalog products={products} onAdd={addItem} initialCategory={catalogCategory} />
      )}
      {tab === "cart" && (
        <Cart
          onOrderPlaced={() => setOrdersRefreshKey((k) => k + 1)}
          onBrowseMenu={() => setTab("catalog")}
          onSeeOrders={() => setTab("profile")}
        />
      )}
      {tab === "profile" && (
        <Profile customer={customer} onNavigateCatalog={() => setTab("catalog")} refreshKey={ordersRefreshKey} />
      )}

      {/* Only on the shop's own web page, and only on the front page:
          inside Telegram the chat behind the app already carries all of
          this, and on the other tabs it would sit under a form. */}
      {tab === "home" && !isTelegram() && <SiteFooter />}

      <BottomNav active={tab} onChange={setTab} cartCount={totalCount} />
    </div>
  );
}

function ThemedApp({ children }) {
  const settings = useSettings();
  const { loaded, failed } = useSettingsStatus();

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.style.setProperty("--accent", settings.primaryColor);
    document.title = settings.businessName;
  }, [loaded, settings.primaryColor, settings.businessName]);

  if (!loaded) return <WakeScreen failed={failed} />;
  return children;
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("onboarding_seen"));
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    initTelegram();
    const who = currentCustomer();
    setCustomer(who);
    // A web customer has no name until their first order, and sending an
    // empty one would overwrite the one they gave last time.
    api.upsertUser(who.firstName ? { firstName: who.firstName } : {}).catch(console.error);
    return watchColorScheme(() => {});
  }, []);

  function finishOnboarding() {
    localStorage.setItem("onboarding_seen", "true");
    setShowOnboarding(false);
  }

  if (!customer) return null;

  return (
    <SettingsProvider>
      <LanguageProvider>
        <ThemedApp>
        {showOnboarding ? (
          <Onboarding onFinish={finishOnboarding} />
        ) : (
          <CartProvider>
            <AppContent customer={customer} />
          </CartProvider>
        )}
        </ThemedApp>
      </LanguageProvider>
    </SettingsProvider>
  );
}
