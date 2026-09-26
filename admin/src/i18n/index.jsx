import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RU } from "./ru";

// The language the panel speaks to the person running the shop.
//
// Uzbek is what the strings in the source already are, so it needs no
// table — a missing Russian translation shows readable Uzbek rather than a
// bare key, which is the failure mode worth having.
const TABLES = { ru: RU };
const STORAGE_KEY = "admin_lang";

const LanguageContext = createContext({ lang: "uz", setLang: () => {}, t: (s) => s });

function stored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "ru" || value === "uz" ? value : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children, fromSettings }) {
  const [lang, setLangState] = useState(() => stored() || "uz");

  // The shop already knows which language its owner reads — they set it
  // when the order alerts were set up. It only decides the first visit:
  // once they have picked in the panel, that is what the panel keeps.
  useEffect(() => {
    if (!fromSettings || stored()) return;
    if (fromSettings === "ru" || fromSettings === "uz") setLangState(fromSettings);
  }, [fromSettings]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage blocked; the choice holds for this visit
    }
  }, []);

  const t = useCallback(
    (text) => {
      const table = TABLES[lang];
      if (!table) return text;
      return table[text] ?? text;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  return useContext(LanguageContext);
}
