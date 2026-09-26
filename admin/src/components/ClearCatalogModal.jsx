import { useState } from "react";
import Modal from "./Modal";
import { api } from "./../api";
import { useT } from "../i18n";

// Emptying the menu is how the bot is handed to a different business, so it
// is a normal step rather than an accident — but it is still irreversible,
// which is why the count is spelled out before the button is pressed.
export default function ClearCatalogModal({ productCount, categoryCount, onClose, onCleared }) {
  const { t } = useT();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function handleClear() {
    setError("");
    setWorking(true);
    try {
      await api.clearCatalog();
      onCleared();
      onClose();
    } catch (err) {
      setError(err.message);
      setWorking(false);
    }
  }

  return (
    <Modal title={t("Katalogni tozalash")} onClose={onClose}>
      <p style={{ marginTop: 0 }}>
        <strong>{t("{n} ta mahsulot", { n: productCount })}</strong>{" "}
        {t("va bo'sh qolgan kategoriyalar o'chiriladi")}
        {categoryCount > 0 ? t(" (hozir {n} ta kategoriya bor)", { n: categoryCount }) : ""}
        {t(". Buni qaytarib bo'lmaydi.")}
      </p>
      <p className="muted">{t("Eski buyurtmalar joyida qoladi — har bir buyurtmada mahsulot nomi va narxi alohida saqlangan.")}</p>
      <p className="muted">
        {t("Shundan keyin yangi menyuni")}{" "}
        <strong>{t("«Menyuni ro'yxat bilan qo'shish»")}</strong> {t("orqali qo'yasiz.")}
      </p>

      {error && <p className="form-error">{error}</p>}

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={working}>
          {t("Bekor qilish")}
        </button>
        <button type="button" className="btn btn-danger" onClick={handleClear} disabled={working}>
          {working ? t("O'chirilmoqda...") : t("{n} ta mahsulotni o'chirish", { n: productCount })}
        </button>
      </div>
    </Modal>
  );
}
