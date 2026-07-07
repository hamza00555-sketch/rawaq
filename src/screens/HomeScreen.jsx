import { useState } from "react";
import { t } from "../i18n.js";
import { formatDate } from "../data.js";
import { press } from "../press.js";
import ProgressRing from "../components/ProgressRing.jsx";
import RawaqLogo from "../components/RawaqLogo.jsx";
import CreateTaskSheet from "../components/CreateTaskSheet.jsx";

export default function HomeScreen({ lang, owner, today, rooms, setRooms, history }) {
  const [createOpen, setCreateOpen] = useState(false);

  const total = today.tasks.length;
  const done = today.tasks.filter((x) => x.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  const lastVisit = history[history.length - 1];

  return (
    <div className="screen">
      <header className="appbar">
        <div className="row">
          <RawaqLogo size={42} />
          <div>
            <h1>{t(lang, "appName")}</h1>
            <p className="muted">
              {owner ? `${t(lang, "hello")} ${owner} 👋 · ` : ""}
              {formatDate(lang, today.date)}
            </p>
          </div>
        </div>
      </header>

      <section className="card ring-wrap" aria-label={t(lang, "todayProgress")}>
        <ProgressRing percent={percent} label={t(lang, "todayProgress")} celebrate={complete} />
        <p className="muted">
          {done} {t(lang, "outOf")} {total} {t(lang, "tasksDone")}
        </p>
        <span className="muted" style={{ fontSize: 14 }}>
          {today.mode === "surface" ? t(lang, "surfaceClean") : t(lang, "deepClean")}
        </span>
        {complete && (
          <p className="congrats" role="status">
            {t(lang, "congrats100")}
          </p>
        )}
      </section>

      {lastVisit && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="row spread" style={{ marginBottom: 8 }}>
            <span className="muted">{t(lang, "lastVisit")}</span>
            <strong>{formatDate(lang, lastVisit.date)}</strong>
          </div>
          <div className="progress-bar">
            <div style={{ width: `${lastVisit.percent}%` }} />
          </div>
          <span className="muted" style={{ fontSize: 14 }}>
            {lastVisit.done} {t(lang, "outOf")} {lastVisit.total} · {lastVisit.percent}%
          </span>
        </div>
      )}

      <div className="stack" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-primary btn-block btn-hero" {...press(() => setCreateOpen(true))}>
          ＋ {t(lang, "createTask")}
        </button>
      </div>

      <CreateTaskSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        lang={lang}
        rooms={rooms}
        setRooms={setRooms}
        defaultMode={today.mode}
      />
    </div>
  );
}
