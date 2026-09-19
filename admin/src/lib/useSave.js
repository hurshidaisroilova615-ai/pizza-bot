import { useState } from "react";

// Every save in this panel used to run inside a try/finally with no catch.
// A failure — a backend still deploying, a field its database does not have
// yet, a dropped connection — left the button un-pressing itself and
// nothing else: no error, no confirmation. The owner concluded the setting
// had not been added, and tried again.
//
// This runs the save, keeps the button disabled while it is in flight, and
// hands back whatever went wrong so the form can say it out loud.
export function useSave() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(run) {
    setSaving(true);
    setError("");
    try {
      const result = await run();
      return { ok: true, result };
    } catch (err) {
      setError(err?.message || "Saqlab bo'lmadi. Internetni tekshirib, qaytadan urinib ko'ring.");
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, setError, save };
}
