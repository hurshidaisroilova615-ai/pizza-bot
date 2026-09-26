import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RU } from "./ru";

// The language the panel speaks to the person running the shop.
//
// Uzbek is what the strings in the source already are, so it needs no
// table — a missing Russian translation shows readable Uzbek rather than a
// bare key, which is the failure mode worth having.
const TABLES = { ru: RU };
const STORAGE_KEY = "admin_lang";

// Slavic rule: 1, 21, 31… take the first form; 2–4, 22–24… the second;
// everything else, the teens included, takes the third. Uzbek has one
// form and simply takes the first.
function pluralIndex(lang, n) {
  const count = Math.abs(Number(n) || 0);
  if (lang !== "ru") return 0;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 0;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1;
  return 2;
}

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

  // Russian picks one of three forms by the number in front of it, so a
  // translation may be three strings rather than one. Getting "5 заказа"
  // onto an owner's dashboard is the clearest possible sign that nobody
  // who reads the language looked at it.
  const t = useCallback(
    (text, vars) => {
      const table = TABLES[lang];
      const found = table ? table[text] : undefined;
      let out = found ?? text;
      if (Array.isArray(out)) out = out[pluralIndex(lang, vars?.n)];
      if (!vars) return out;
      for (const [name, value] of Object.entries(vars)) {
        out = out.split(`{${name}}`).join(String(value));
      }
      return out;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  return useContext(LanguageContext);
}
