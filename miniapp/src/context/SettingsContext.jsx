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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        setSettings({ ...FALLBACK, ...data });
        setLoaded(true);
      })
      // The request already retried for a minute, so this is a server that
      // is genuinely not answering. Saying so beats rendering the fallback
      // brand over an empty menu and letting a customer think that is the
      // shop.
      .catch(() => setFailed(true));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, failed }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings SettingsProvider ichida ishlatilishi kerak");
  return ctx.settings;
}

// The shell waits on this before rendering: the business name and colours
// arrive with the settings, and showing the fallback brand first would put
// the wrong shop's name in front of a customer.
export function useSettingsStatus() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsStatus SettingsProvider ichida ishlatilishi kerak");
  return { loaded: ctx.loaded, failed: ctx.failed };
}
