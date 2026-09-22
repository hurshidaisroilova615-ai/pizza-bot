import Icon from "./Icon";
import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n/LanguageContext";

// What a customer sees the moment their order goes through.
//
// Inside Telegram this screen is never reached: the app closes and the
// confirmation is already sitting in the chat behind it. On the shop's own
// web address there is no chat and nothing behind the page, so closing it
// would leave the customer staring at a blank tab wondering whether the
// order was placed at all. This is what stands in for that chat.
export default function OrderPlaced({ order, onBackToMenu }) {
  const settings = useSettings();
  const { t } = useI18n();

  return (
    <div className="placed">
      <div className="placed-mark">
        <Icon name="check" size={34} strokeWidth={2.4} />
      </div>

      <h1 className="placed-title">{t("placed.title")}</h1>
      <p className="placed-number">{t("placed.number", { id: order.id })}</p>

      <div className="placed-total">
        {order.totalPrice.toLocaleString()} {settings.currency}
      </div>

      <div className="placed-notes">
        <p>{t("placed.callSoon")}</p>
        {order.orderType === "PICKUP" && settings.pickupAddress && (
          <p>{t("placed.pickupWhere", { address: settings.pickupAddress })}</p>
        )}
        {order.paymentMethod === "CARD" && <p>{t("placed.cardNote")}</p>}
        <p className="placed-keep">{t("placed.saveNumber")}</p>
      </div>

      <button type="button" className="btn-primary placed-back" onClick={onBackToMenu}>
        {t("placed.backToMenu")}
      </button>
    </div>
  );
}
