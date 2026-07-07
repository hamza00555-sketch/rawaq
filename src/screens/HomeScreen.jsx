import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import ProgressRing from "../components/ProgressRing.jsx";
import RawaqLogo from "../components/RawaqLogo.jsx";
import CreateTaskSheet from "../components/CreateTaskSheet.jsx";

export default function HomeScreen({ lang, owner, today, rooms, setRooms, onShare, onWorkerMode }) {
  const [createOpen, setCreateOpen] = useState(false);

  const total = today.tasks.length;
  const done = today.tasks.filter((x) => x.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="screen">
      <header className="appbar">
        <div className="row">
          <RawaqLogo size={42} />
          <div>
            <h1>{t(lang, "appName")}</h1>
            {owner && <p className="muted">{t(lang, "hello")} {owner} 👋</p>}
          </div>
        </div>
      </header>

      <section className="card ring-wrap" aria-label={t(lang, "todayProgress")}>
        <ProgressRing percent={percent} label={t(lang, "todayProgress")} />
        <p className="muted">
          {done} {t(lang, "outOf")} {total} {t(lang, "tasksDone")}
        </p>
        <span className="muted" style={{ fontSize: 14 }}>
          {today.mode === "surface" ? t(lang, "surfaceClean") : t(lang, "deepClean")}
        </span>
      </section>

      <div className="stack" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn-primary btn-block btn-hero" {...press(() => setCreateOpen(true))}>
          ＋ {t(lang, "createTask")}
        </button>
        <button type="button" className="btn btn-soft btn-block" {...press(onShare)}>
          📤 {t(lang, "shareTasks")}
        </button>
        <button type="button" className="btn btn-soft btn-block" {...press(onWorkerMode)}>
          🧕 {t(lang, "workerMode")}
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
