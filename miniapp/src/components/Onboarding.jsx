import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import Icon from "./Icon";
import { hapticFeedback } from "../telegram";
import { useI18n } from "../i18n/LanguageContext";

export default function Onboarding({ onFinish }) {
  const settings = useSettings();
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  // A title carrying two sentences was doing the job of a title and a
  // subtitle at once, so neither read as either. Split, the eye takes the
  // headline first and the explanation second.
  const slides = [
    {
      icon: "bag",
      title: `${settings.businessName}`,
      text: t("onboarding.menuText"),
    },
    {
      icon: "truck",
      title: t("onboarding.deliveryTitle"),
      text: t("onboarding.deliveryText"),
    },
    {
      icon: "gift",
      title: t("onboarding.bonusTitle"),
      text: t("onboarding.bonusText"),
    },
  ];

  const isLast = step === slides.length - 1;
  const slide = slides[step];

  function next() {
    hapticFeedback("light");
    if (isLast) onFinish();
    else setStep((s) => s + 1);
  }

  return (
    <div className="onboarding">
      <div className="onboarding-top">
        {!isLast && (
          <button className="onboarding-skip" onClick={onFinish}>
            {t("onboarding.skip")}
          </button>
        )}
      </div>

      {/* Keyed on the step so React remounts it and the entrance animation
          replays on every slide instead of only the first. */}
      <div className="onboarding-slide" key={step}>
        <div className="onboarding-icon">
          <Icon name={slide.icon} size={40} strokeWidth={1.6} />
        </div>
        <h1 className="onboarding-title">{slide.title}</h1>
        <p className="onboarding-text">{slide.text}</p>
      </div>

      <div className="onboarding-dots">
        {slides.map((_, i) => (
          <div key={i} className={`onboarding-dot ${i === step ? "active" : ""}`} />
        ))}
      </div>

      <div className="onboarding-footer">
        <button className="btn-primary" onClick={next}>
          {isLast ? t("onboarding.start") : t("onboarding.next")}
        </button>
      </div>
    </div>
  );
}
