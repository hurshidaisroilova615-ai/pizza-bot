import { useState } from "react";
import { api, setToken } from "../api";
import { useT } from "../i18n";

// Changing the password logs out every other device, so this is also how an
// admin login lent to a client for a trial gets taken back.
export default function ChangePasswordForm() {
  const { t } = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setDone(false);

    if (newPassword.length < 6) {
      setError(t("Yangi parol kamida 6 ta belgidan iborat bo'lsin"));
      return;
    }
    if (newPassword !== repeatPassword) {
      setError(t("Yangi parol ikkala katakda bir xil yozilishi kerak"));
      return;
    }

    setSaving(true);
    try {
      const { token } = await api.changePassword(currentPassword, newPassword);
      setToken(token);
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <div className="settings-section">
        <h3>{t("Admin paroli")}</h3>
        <p className="field-hint" style={{ marginBottom: 16 }}>
          {t("Parolni o'zgartirsangiz, boshqa qurilmalardagi kirishlar darhol uziladi. Botni birovga sinab ko'rish uchun bergan bo'lsangiz, shu yerdan parolni almashtirib kirishni qaytarib olasiz.")}
        </p>
        <div className="form-row">
          <div className="form-group">
            <label>{t("Joriy parol")}</label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>{t("Yangi parol")}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>{t("Yangi parolni takrorlang")}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="modal-actions">
          {error && <span className="form-error">{error}</span>}
          {done && <span className="form-success">{t("Parol o'zgartirildi ✓")}</span>}
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? t("Saqlanmoqda...") : t("Parolni o'zgartirish")}
          </button>
        </div>
      </div>
    </form>
  );
}
