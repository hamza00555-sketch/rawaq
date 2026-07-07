import { useEffect, useRef, useState } from "react";
import { LANGS, t } from "../i18n.js";
import { formatDate } from "../data.js";
import { press } from "../press.js";

export default function SettingsScreen({ lang, setLang, theme, setTheme, owner, setOwner, history }) {
  const [nameDraft, setNameDraft] = useState(owner);
  const [savedMsg, setSavedMsg] = useState(false);
  const firstRender = useRef(true);

  // Auto-save the name (debounced) — no Save button.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setOwner(nameDraft.trim());
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 1500);
    }, 600);
    return () => clearTimeout(timer);
  }, [nameDraft, setOwner]);

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
                aria-label={meta.label}
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
      <div className="card">
        <input
          className="input"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder={t(lang, "ownerNamePlaceholder")}
          aria-label={t(lang, "ownerName")}
        />
        {savedMsg && (
          <p className="muted" role="status" style={{ marginTop: 8 }}>
            {t(lang, "saved")}
          </p>
        )}
      </div>

      <h2 className="section-title">{t(lang, "history")}</h2>
      {history.length === 0 ? (
        <div className="card center-text muted">{t(lang, "noHistory")}</div>
      ) : (
        <div className="stack">
          {[...history].reverse().map((visit) => (
            <div key={visit.id} className="history-item">
              <div className="row spread">
                <strong>{formatDate(lang, visit.date)}</strong>
                <span className="muted">
                  {visit.done} {t(lang, "outOf")} {visit.total} · {visit.percent}%
                </span>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${visit.percent}%` }} />
              </div>
              <span className="muted" style={{ fontSize: 14 }}>
                {visit.mode === "surface" ? t(lang, "surfaceClean") : t(lang, "deepClean")}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="muted center-text" style={{ marginTop: 26, fontSize: 13 }}>
        {t(lang, "appName")} · {t(lang, "version")} 4.0
      </p>
    </div>
  );
}
