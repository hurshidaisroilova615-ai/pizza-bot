import { useSettings } from "../context/SettingsContext";

// Outside trading hours the customer can still browse the menu, but they
// should learn the kitchen is shut on the first screen — not at the bottom
// of the cart after typing in their address.
export default function ClosedBanner() {
  const settings = useSettings();
  const opening = settings.opening;
  if (!opening || opening.isOpen !== false) return null;

  return (
    <div className="closed-banner">
      <span className="closed-banner-dot" />
      <div>
        <p className="closed-banner-title">Hozir yopiqmiz</p>
        <p className="closed-banner-text">
          Ish vaqti: {opening.openTime} - {opening.closeTime}. Menyuni ko'rib turishingiz mumkin.
        </p>
      </div>
    </div>
  );
}
