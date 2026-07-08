import { useState } from "react";
import { t } from "../i18n.js";
import { formatDate } from "../data.js";
import { press } from "../press.js";
import ProgressRing from "../components/ProgressRing.jsx";
import RawaqLogo from "../components/RawaqLogo.jsx";
import CreateTaskSheet from "../components/CreateTaskSheet.jsx";
import Snackbar from "../components/Snackbar.jsx";
import Icon from "../components/Icons.jsx";

export default function HomeScreen({ lang, owner, today, rooms, setRooms, history, onShare, nextVisit }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [snack, setSnack] = useState(null);

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
        {nextVisit && (
          <span className="muted" style={{ fontSize: 14 }}>
            <Icon name="calendar" size={16} /> {t(lang, "nextVisit")}: {formatDate(lang, nextVisit)}
          </span>
        )}
        {complete && (
          <div className="congrats celebrate-pop" role="status" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <img src="/illustrations/celebrate.webp" alt="" className="celebrate-illus" />
            <p>{t(lang, "congrats100")}</p>
          </div>
        )}
      </section>

      <div className="stack" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-primary btn-block btn-hero" {...press(onShare)}>
          <Icon name="share" size={22} /> {t(lang, "shareHero")}
        </button>
        <button type="button" className="btn btn-soft btn-block" style={{ minHeight: 54 }} {...press(() => setCreateOpen(true))}>
          <Icon name="plus" size={20} /> {t(lang, "createTask")}
        </button>
      </div>

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

      <CreateTaskSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        lang={lang}
        rooms={rooms}
        setRooms={setRooms}
        onAdded={() => setSnack({ message: t(lang, "taskAdded") })}
      />

      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
    </div>
  );
}
