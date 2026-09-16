import { useState } from "react";
import { useSettings } from "../context/SettingsContext";

export default function Onboarding({ onFinish }) {
  const settings = useSettings();
  const [step, setStep] = useState(0);

  const slides = [
    {
      emoji: "🛍",
      title: `Ochlik yoki shoping kayfiyati?\n${settings.businessName} siz uchun tayyor.`,
    },
    {
      emoji: "⚡️",
      title: "Bu qanday ishlaydi?\nTanlang, buyurtma bering va rohatlaning.",
    },
    {
      emoji: "🎁",
      title: "Har xaridingiz uchun bonus ball to'planadi\nva chegirmalarga aylanadi.",
    },
  ];

  const isLast = step === slides.length - 1;

  return (
    <div className="onboarding">
      <div className="onboarding-slide">
        <div className="onboarding-emoji">{slides[step].emoji}</div>
        <h1 className="onboarding-title">{slides[step].title}</h1>
      </div>
      <div className="onboarding-dots">
        {slides.map((_, i) => (
          <div key={i} className={`onboarding-dot ${i === step ? "active" : ""}`} />
        ))}
      </div>
      <div className="onboarding-footer">
        <button className="btn-primary" onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}>
          {isLast ? "Boshla" : "Davom etish"}
        </button>
      </div>
    </div>
  );
}
