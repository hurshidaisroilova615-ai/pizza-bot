import { useEffect, useState } from "react";

// On a free instance the first visitor after a quiet spell waits half a
// minute for the server to start. Without this they would be looking at an
// empty shop under a placeholder name and would reasonably conclude it is
// broken — so say what is happening, and only once the wait is long enough
// to need explaining.
export default function WakeScreen({ failed = false }) {
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWaited((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (failed) {
    return (
      <div className="wake-screen">
        <p className="wake-title">Server javob bermayapti</p>
        <p className="wake-note">
          Bir daqiqadan keyin sahifani qaytadan oching. Takrorlansa, do'konga telefon orqali
          murojaat qiling.
        </p>
      </div>
    );
  }

  return (
    <div className="wake-screen">
      <div className="wake-spinner" aria-hidden="true" />
      <p className="wake-title">Yuklanmoqda</p>
      {waited >= 4 && (
        <p className="wake-note">
          Server uyg'onmoqda — bu birinchi ochilishda 30 soniyagacha davom etadi. Keyingi
          ochilishlar bir zumda bo'ladi.
        </p>
      )}
    </div>
  );
}
