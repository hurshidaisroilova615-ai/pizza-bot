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
  applyColorScheme();
  return tg;
}

// Telegram publishes the customer's own theme, and changes it under the app
// if they switch while it is open. Following it is the difference between an
// app that belongs on their phone and a white page that burns their eyes at
// night. Outside Telegram we follow the browser instead, so the same code
// behaves during local testing.
export function applyColorScheme() {
  const tg = getTelegramWebApp();
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = tg ? tg.colorScheme === "dark" : prefersDark;
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#17171b" : "#ffffff");
  return dark;
}

// Telegram fires themeChanged when the customer flips their theme; the
// browser has its own event for the same thing during local testing.
export function watchColorScheme(onChange) {
  const tg = getTelegramWebApp();
  const handler = () => onChange(applyColorScheme());
  if (tg?.onEvent) {
    tg.onEvent("themeChanged", handler);
    return () => tg.offEvent?.("themeChanged", handler);
  }
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  mq?.addEventListener?.("change", handler);
  return () => mq?.removeEventListener?.("change", handler);
}

// True only when the app is really running inside Telegram. A page opened
// at the shop's own web address has the script but no account behind it.
export function isInsideTelegram() {
  return Boolean(getTelegramWebApp()?.initDataUnsafe?.user);
}

// The Telegram customer, or null when there is none.
//
// This used to hand back a shared fake account outside Telegram, which was
// harmless while the app only ever ran inside it. On a public website it
// would mean every visitor sharing one account and reading each other's
// orders, so the absence is now reported honestly and identity.js supplies
// a per-browser one instead.
export function getTelegramUser() {
  const tg = getTelegramWebApp();
  const user = tg?.initDataUnsafe?.user;
  if (!user) return null;
  return {
    telegramId: String(user.id),
    firstName: user.first_name || "Mehmon",
    lastName: user.last_name || "",
    username: user.username || "",
    languageCode: user.language_code || "",
  };
}

// The raw, Telegram-signed initData string. The backend verifies this HMAC
// server-side so it can trust the user identity instead of the body params.
export function getInitData() {
  const tg = getTelegramWebApp();
  return tg?.initData || "";
}

// Closing is what finishes an order inside Telegram — the chat is waiting
// behind the app with the confirmation already in it. On the website there
// is nothing behind the page, so the caller is told whether the app closed
// and shows a thank-you screen when it did not.
export function closeMiniApp() {
  const tg = getTelegramWebApp();
  if (!tg || !isInsideTelegram()) return false;
  tg.close();
  return true;
}

export function hapticFeedback(style = "light") {
  const tg = getTelegramWebApp();
  try {
    tg?.HapticFeedback?.impactOccurred(style);
  } catch {
    // haptics unsupported, ignore
  }
}

// The short buzz that confirms something landed — a dish in the cart, an
// order accepted. Phones do this for native apps and people notice its
// absence without being able to name it.
export function notificationHaptic(type = "success") {
  const tg = getTelegramWebApp();
  try {
    tg?.HapticFeedback?.notificationOccurred(type);
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
