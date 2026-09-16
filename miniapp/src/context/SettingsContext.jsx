import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const SettingsContext = createContext(null);

const FALLBACK = {
  businessName: "SmartOrder",
  currency: "so'm",
  deliveryFee: 0,
  freeDeliveryThreshold: null,
  minOrderAmount: 0,
  loyaltyEnabled: true,
  loyaltyPointValue: 1,
  primaryColor: "#ff3b30",
  welcomeMessage: "",
  aboutText: "",
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((data) => setSettings({ ...FALLBACK, ...data }))
      .catch(() => setSettings(FALLBACK))
      .finally(() => setLoaded(true));
  }, []);

  return <SettingsContext.Provider value={{ settings, loaded }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings SettingsProvider ichida ishlatilishi kerak");
  return ctx.settings;
}
