import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n/LanguageContext";

// Outside trading hours the customer can still browse the menu, but they
// should learn the kitchen is shut on the first screen — not at the bottom
// of the cart after typing in their address.
export default function ClosedBanner() {
  const settings = useSettings();
  const { t } = useI18n();
  const opening = settings.opening;
  if (!opening || opening.isOpen !== false) return null;

  return (
    <div className="closed-banner">
      <span className="closed-banner-dot" aria-hidden="true" />
      <div>
        <p className="closed-banner-title">{t("closed.title")}</p>
        <p className="closed-banner-text">
          {t("closed.text", { open: opening.openTime, close: opening.closeTime })}
        </p>
      </div>
    </div>
  );
}
