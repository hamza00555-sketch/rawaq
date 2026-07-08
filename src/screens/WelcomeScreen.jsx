import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";

// First-run only: a friendly ask for mom's name (skippable).
export default function WelcomeScreen({ lang, onDone }) {
  const [name, setName] = useState("");

  return (
    <div className="splash welcome" style={{ gap: 14, padding: 24 }}>
      <img
        src="/illustrations/welcome.webp"
        alt=""
        style={{ width: "min(300px, 78%)", height: "auto", marginBottom: 4 }}
      />
      <h1 style={{ fontSize: 28 }}>{t(lang, "welcomeTitle")}</h1>
      <p className="muted" style={{ fontSize: 18 }}>{t(lang, "welcomeAsk")}</p>
      <input
        className="input"
        style={{ maxWidth: 320, textAlign: "center" }}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t(lang, "ownerNamePlaceholder")}
        aria-label={t(lang, "welcomeAsk")}
      />
      <p className="muted" style={{ fontSize: 13 }}>{t(lang, "welcomeHint")}</p>
      <button
        type="button"
        className="btn btn-primary btn-hero"
        style={{ minWidth: 220 }}
        {...press(() => onDone(name.trim()))}
      >
        {t(lang, "start")}
      </button>
      <button type="button" className="btn" {...press(() => onDone(""))}>
        {t(lang, "skip")}
      </button>
    </div>
  );
}
