import { t } from "../i18n.js";

export default function HistoryScreen({ lang, history }) {
  return (
    <div className="screen">
      <header className="appbar">
        <h1>{t(lang, "history")}</h1>
      </header>
      {history.length === 0 ? (
        <div className="card center-text muted">{t(lang, "noHistory")}</div>
      ) : (
        <div className="stack">
          {[...history].reverse().map((visit) => (
            <div key={visit.id} className="history-item">
              <div className="row spread">
                <strong>{visit.date}</strong>
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
    </div>
  );
}
