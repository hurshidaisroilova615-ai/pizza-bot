import { useEffect, useState } from "react";
import { useI18n } from "../i18n/LanguageContext";

// On a free instance the first visitor after a quiet spell waits half a
// minute for the server to start. Without this they would be looking at an
// empty shop under a placeholder name and would reasonably conclude it is
// broken — so say what is happening, and only once the wait is long enough
// to need explaining.
export default function WakeScreen({ failed = false }) {
  const { t } = useI18n();
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWaited((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (failed) {
    return (
      <div className="wake-screen">
        <p className="wake-title">{t("wake.failedTitle")}</p>
        <p className="wake-note">{t("wake.failedNote")}</p>
      </div>
    );
  }

  return (
    <div className="wake-screen">
      <div className="wake-spinner" aria-hidden="true" />
      <p className="wake-title">{t("wake.loading")}</p>
      {waited >= 4 && <p className="wake-note">{t("wake.note")}</p>}
    </div>
  );
}
