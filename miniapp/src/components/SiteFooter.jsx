import Icon from "./Icon";
import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n/LanguageContext";

// The bottom of a shop's own web page.
//
// Inside Telegram none of this is needed: the bot's chat is one tap away
// and it carries the shop's name and contact already. A website has no
// chat behind it, so the things a customer looks for before trusting a
// place to take their money — a phone number that dials, where it is, when
// it is open — have to be on the page itself.
export default function SiteFooter() {
  const settings = useSettings();
  const { t } = useI18n();

  const phone = settings.supportPhone;
  const address = settings.pickupAddress;
  const hours = settings.openTime && settings.closeTime
    ? `${settings.openTime} – ${settings.closeTime}`
    : null;

  if (!phone && !address && !hours) return null;

  return (
    <footer className="site-footer">
      <p className="site-footer-name">{settings.businessName}</p>

      {phone && (
        // tel: is what turns a number on a page into a call on a phone,
        // which is still how half of these customers would rather order.
        <a className="site-footer-row site-footer-call" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
          <Icon name="phone" size={17} strokeWidth={2} />
          <span>{phone}</span>
        </a>
      )}

      {address && (
        <p className="site-footer-row">
          <Icon name="pin" size={17} strokeWidth={2} />
          <span>{address}</span>
        </p>
      )}

      {hours && (
        <p className="site-footer-row">
          <Icon name="clock" size={17} strokeWidth={2} />
          <span>{t("site.hours", { hours })}</span>
        </p>
      )}
    </footer>
  );
}
