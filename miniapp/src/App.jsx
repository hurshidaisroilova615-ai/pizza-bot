import { useEffect, useState } from "react";
import Onboarding from "./components/Onboarding";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import { CartProvider, useCart } from "./context/CartContext";
import { SettingsProvider, useSettings, useSettingsStatus } from "./context/SettingsContext";
import WakeScreen from "./components/WakeScreen";
import ClosedBanner from "./components/ClosedBanner";
import { api } from "./api";
import { initTelegram, getTelegramUser, watchColorScheme } from "./telegram";

function AppContent({ telegramUser }) {
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
          firstName={telegramUser.firstName}
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
      {tab === "cart" && <Cart onOrderPlaced={() => setOrdersRefreshKey((k) => k + 1)} />}
      {tab === "profile" && (
        <Profile telegramUser={telegramUser} onNavigateCatalog={() => setTab("catalog")} refreshKey={ordersRefreshKey} />
      )}

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
  const [telegramUser, setTelegramUser] = useState(null);

  useEffect(() => {
    initTelegram();
    const user = getTelegramUser();
    setTelegramUser(user);
    api.upsertUser({ firstName: user.firstName }).catch(console.error);
    return watchColorScheme(() => {});
  }, []);

  function finishOnboarding() {
    localStorage.setItem("onboarding_seen", "true");
    setShowOnboarding(false);
  }

  if (!telegramUser) return null;

  return (
    <SettingsProvider>
      <ThemedApp>
        {showOnboarding ? (
          <Onboarding onFinish={finishOnboarding} />
        ) : (
          <CartProvider>
            <AppContent telegramUser={telegramUser} />
          </CartProvider>
        )}
      </ThemedApp>
    </SettingsProvider>
  );
}
