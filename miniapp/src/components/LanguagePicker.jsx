import { useI18n, LANGUAGES } from "../i18n/LanguageContext";
import { hapticFeedback } from "../telegram";

// Most customers never see this: the app already opens in the language
// their own Telegram is set to. It is here for the ones whose phone
// language isn't the one they'd rather read a menu in.
export default function LanguagePicker() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-block">
      <p className="field-label lang-label">{t("profile.language")}</p>
      <div className="lang-row" role="group" aria-label={t("profile.language")}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            className={`lang-chip ${lang === l.code ? "active" : ""}`}
            onClick={() => {
              hapticFeedback("light");
              setLang(l.code);
            }}
            aria-pressed={lang === l.code}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
