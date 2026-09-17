import { useEffect, useState } from "react";
import Onboarding from "./components/Onboarding";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import { CartProvider, useCart } from "./context/CartContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { api } from "./api";
import { initTelegram, getTelegramUser } from "./telegram";

function AppContent({ telegramUser }) {
  const [tab, setTab] = useState("home");
  const [products, setProducts] = useState([]);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const { addItem, totalCount } = useCart();

  useEffect(() => {
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  return (
    <div className="app-shell">
      {tab === "home" && (
        <Home
          firstName={telegramUser.firstName}
          products={products}
          onAdd={addItem}
          onOrderClick={() => setTab("catalog")}
        />
      )}
      {tab === "catalog" && <Catalog products={products} onAdd={addItem} />}
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
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", settings.primaryColor);
    document.title = settings.businessName;
  }, [settings.primaryColor, settings.businessName]);
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
