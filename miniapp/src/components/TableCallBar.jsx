import { useState } from "react";
import Icon from "./Icon";
import { api } from "../api";
import { useSettings } from "../context/SettingsContext";
import { useI18n } from "../i18n/LanguageContext";
import { currentTable } from "../table";
import { notificationHaptic } from "../telegram";

// The rest of what somebody sitting at a table wants from a waiter.
//
// The code on the table opens the menu, which covers ordering. It does not
// cover the two other times a guest needs somebody: when they want to ask
// something, and when they are ready to pay. Both end with a guest turning
// round in their chair looking for a face — which is the same wait the
// menu was meant to remove.
//
// Only shown to somebody who actually scanned a table: ordering from home
// has a phone number for this.
export default function TableCallBar() {
  const settings = useSettings();
  const { t } = useI18n();
  const table = currentTable();
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!table || !settings.dineInEnabled) return null;

  async function call(kind) {
    if (busy) return;
    setBusy(true);
    try {
      await api.callWaiter(table, kind);
      notificationHaptic("success");
      setSent(kind);
      // Long enough to be read, short enough that a guest who then wants
      // the bill is not left looking at the wrong message.
      setTimeout(() => setSent(null), 8000);
    } catch {
      setSent("failed");
      setTimeout(() => setSent(null), 5000);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="table-call sent">
        <Icon name="check" size={17} strokeWidth={2.4} />
        <span>{sent === "failed" ? t("table.callFailed") : t("table.called")}</span>
      </div>
    );
  }

  return (
    <div className="table-call">
      <button type="button" disabled={busy} onClick={() => call("WAITER")}>
        {t("table.callWaiter")}
      </button>
      <button type="button" disabled={busy} onClick={() => call("BILL")}>
        {t("table.askBill")}
      </button>
    </div>
  );
}
