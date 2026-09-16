// Telegram Mini App SDK bilan ishlash uchun yordamchi.
// Agar ilova oddiy brauzerda (Telegram tashqarisida) ochilsa, sinov uchun
// soxta (mock) foydalanuvchi qaytaramiz, shunda localhost'da ham UI'ni ko'rish mumkin.

export function getTelegramWebApp() {
  return window.Telegram?.WebApp || null;
}

export function initTelegram() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor?.("secondary_bg_color");
      tg.enableClosingConfirmation?.();
    } catch {
      // older Telegram clients may not support these calls
    }
  }
  return tg;
}

export function getTelegramUser() {
  const tg = getTelegramWebApp();
  const user = tg?.initDataUnsafe?.user;
  if (user) {
    return {
      telegramId: String(user.id),
      firstName: user.first_name || "Mehmon",
      lastName: user.last_name || "",
      username: user.username || "",
    };
  }
  // Brauzerda sinash uchun zaxira (fallback) foydalanuvchi
  return {
    telegramId: "000000000",
    firstName: "Mehmon",
    lastName: "",
    username: "",
  };
}

// The raw, Telegram-signed initData string. The backend verifies this HMAC
// server-side so it can trust the user identity instead of the body params.
export function getInitData() {
  const tg = getTelegramWebApp();
  return tg?.initData || "";
}

export function closeMiniApp() {
  const tg = getTelegramWebApp();
  if (tg) tg.close();
}

export function hapticFeedback(style = "light") {
  const tg = getTelegramWebApp();
  try {
    tg?.HapticFeedback?.impactOccurred(style);
  } catch {
    // haptics unsupported, ignore
  }
}

export function showMainButton(text, onClick) {
  const tg = getTelegramWebApp();
  if (!tg?.MainButton) return () => {};
  tg.MainButton.setText(text);
  tg.MainButton.show();
  tg.MainButton.onClick(onClick);
  return () => {
    tg.MainButton.hide();
    tg.MainButton.offClick(onClick);
  };
}
