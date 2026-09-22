import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { messages, LANGUAGES, PLURALS, pluralIndex } from "./messages";
import { getTelegramUser } from "../telegram";
import { api } from "../api";

const STORE_KEY = "miniapp_lang";
const SUPPORTED = LANGUAGES.map((l) => l.code);
const FALLBACK = "uz";

// Telegram hands over the language the customer's own app is set to. Using
// it means a Russian-speaking guest opens the menu in Russian without
// knowing there was a setting to find; the picker in the profile is for the
// minority whose phone language isn't the one they want to read in.
function storedLocally() {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    return stored && SUPPORTED.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

function detect() {
  const stored = storedLocally();
  if (stored) return stored;
  // Outside Telegram there is no account to ask, so the browser answers.
  const code = (getTelegramUser()?.languageCode || navigator.language || "").slice(0, 2).toLowerCase();
  // Kazakh, Kyrgyz and Tajik customers read Russian far more often than
  // English, so they land on Russian rather than the fallback.
  if (["ru", "kk", "ky", "tg", "be", "uk"].includes(code)) return "ru";
  if (code === "en") return "en";
  if (code === "uz") return "uz";
  return FALLBACK;
}

const LanguageContext = createContext({ lang: FALLBACK, setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detect);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  // A customer who picked a language in the bot should not have to pick it
  // again here. Their choice is only adopted when this browser has none of
  // its own, so a switch made in the app is never undone by the server.
  useEffect(() => {
    if (storedLocally()) return;
    let active = true;
    api
      .getMe()
      .then((me) => {
        if (active && me?.language && SUPPORTED.includes(me.language)) setLangState(me.language);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setLang = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(STORE_KEY, next);
    } catch {
      // the choice just won't survive a reload; not worth failing over
    }
    // The bot's own messages follow the same choice. A failure here only
    // means the bot keeps using whatever it had.
    api.upsertUser({ language: next }).catch(() => {});
  }, []);

  // A missing key falls back to Uzbek rather than rendering the key itself,
  // so a string added in one language is never shown raw to a customer.
  const t = useCallback(
    (key, vars) => {
      const table = messages[lang] || messages[FALLBACK];
      let text = table[key] ?? messages[FALLBACK][key] ?? key;

      // A key with a counted noun picks its form from the number first, so
      // "1 блюдо" and "5 блюд" both read the way they are spoken.
      const forms = PLURALS[lang]?.[key];
      if (forms && vars) {
        const n = vars.count ?? vars.points;
        if (n !== undefined) text = forms[pluralIndex(lang, n)] ?? text;
      }
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.split(`{${name}}`).join(String(value));
        }
      }
      return text;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}

export { LANGUAGES };
