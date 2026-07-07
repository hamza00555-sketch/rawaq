import { useState } from "react";
import { LANGS, t } from "../i18n.js";
import { press } from "../press.js";
import PinModal from "../components/PinModal.jsx";

export default function SettingsScreen({ lang, setLang, theme, setTheme, owner, setOwner, pin, setPin }) {
  const [nameDraft, setNameDraft] = useState(owner);
  const [savedMsg, setSavedMsg] = useState(false);
  // PIN change: step = null | "current" | "new" | "confirm"
  const [pinStep, setPinStep] = useState(null);
  const [pinError, setPinError] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinDone, setPinDone] = useState(false);

  const saveName = () => {
    setOwner(nameDraft.trim());
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1800);
  };

  const handlePin = (value) => {
    setPinError("");
    if (pinStep === "current") {
      if (value === pin) setPinStep("new");
      else setPinError(t(lang, "wrongPin"));
    } else if (pinStep === "new") {
      setNewPin(value);
      setPinStep("confirm");
    } else if (pinStep === "confirm") {
      if (value === newPin) {
        setPin(value);
        setPinStep(null);
        setPinDone(true);
        setTimeout(() => setPinDone(false), 2200);
      } else {
        setPinError(t(lang, "pinMismatch"));
        setPinStep("new");
      }
    }
  };

  const pinTitles = {
    current: t(lang, "enterCurrentPin"),
    new: t(lang, "enterNewPin"),
    confirm: t(lang, "confirmNewPin"),
  };

  return (
    <div className="screen">
      <header className="appbar">
        <h1>{t(lang, "settings")}</h1>
      </header>

      <div className="card stack">
        <div className="setting-row">
          <span>{t(lang, "language")}</span>
          <div className="seg" style={{ flex: 1, maxWidth: 280 }}>
            {Object.entries(LANGS).map(([code, meta]) => (
              <button
                key={code}
                type="button"
                className={`seg-btn ${lang === code ? "active" : ""}`}
                aria-pressed={lang === code}
                {...press(() => setLang(code))}
              >
                {meta.flag}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <span>{t(lang, "theme")}</span>
          <div className="seg" style={{ flex: 1, maxWidth: 280 }}>
            <button
              type="button"
              className={`seg-btn ${theme === "light" ? "active" : ""}`}
              aria-pressed={theme === "light"}
              {...press(() => setTheme("light"))}
            >
              ☀️ {t(lang, "light")}
            </button>
            <button
              type="button"
              className={`seg-btn ${theme === "dark" ? "active" : ""}`}
              aria-pressed={theme === "dark"}
              {...press(() => setTheme("dark"))}
            >
              🌙 {t(lang, "dark")}
            </button>
          </div>
        </div>
      </div>

      <h2 className="section-title">{t(lang, "ownerName")}</h2>
      <div className="card stack">
        <input
          className="input"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder={t(lang, "ownerNamePlaceholder")}
          aria-label={t(lang, "ownerName")}
        />
        <button type="button" className="btn btn-primary" {...press(saveName)}>
          {savedMsg ? t(lang, "saved") : t(lang, "save")}
        </button>
      </div>

      <h2 className="section-title">{t(lang, "changePin")}</h2>
      <div className="card">
        <button
          type="button"
          className="btn btn-soft btn-block"
          {...press(() => {
            setPinError("");
            setPinStep("current");
          })}
        >
          🔒 {pinDone ? t(lang, "pinChanged") : t(lang, "changePin")}
        </button>
      </div>

      <p className="muted center-text" style={{ marginTop: 26, fontSize: 13 }}>
        {t(lang, "appName")} · {t(lang, "version")} 3.0
      </p>

      {pinStep && (
        <PinModal
          title={pinTitles[pinStep]}
          error={pinError}
          onSubmit={handlePin}
          onCancel={() => setPinStep(null)}
          cancelLabel={t(lang, "cancel")}
        />
      )}
    </div>
  );
}
