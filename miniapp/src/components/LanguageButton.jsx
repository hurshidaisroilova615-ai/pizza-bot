import { useEffect, useRef, useState } from "react";
import { useI18n, LANGUAGES } from "../i18n/LanguageContext";
import { hapticFeedback } from "../telegram";

// The app opens in whatever language the customer's own Telegram is set to,
// which is right for them and wrong for anyone checking the shop from a
// phone set to another language. Buried in the profile it may as well not
// exist — so it sits in the header, two taps from any screen.
export default function LanguageButton() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="lang-menu" ref={ref}>
      <button
        className="lang-btn"
        onClick={() => {
          hapticFeedback("light");
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current.short}
      </button>

      {open && (
        <div className="lang-pop" role="listbox">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              className={`lang-pop-item ${l.code === lang ? "active" : ""}`}
              onClick={() => {
                hapticFeedback("light");
                setLang(l.code);
                setOpen(false);
              }}
            >
              <span className="lang-pop-short">{l.short}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
