import { t } from "../i18n.js";
import { press } from "../press.js";
import ProgressRing from "../components/ProgressRing.jsx";
import RawaqLogo from "../components/RawaqLogo.jsx";

export default function HomeScreen({ lang, owner, today, rooms, setTab, onShare, onWorkerMode }) {
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

      <h2 className="section-title">{t(lang, "roomsSummary")}</h2>
      <div className="rooms-grid">
        {rooms.map((room) => {
          const roomTasks = today.tasks.filter((x) => x.roomId === room.id);
          const roomDone = roomTasks.filter((x) => x.done).length;
          return (
            <button
              key={room.id}
              type="button"
              className="room-card"
              {...press(() => setTab("rooms"))}
            >
              <div className="room-card-body">
                <h3>
                  {room.emoji} {room.name[lang] || room.name.ar}
                </h3>
                <p className="muted" style={{ fontSize: 14 }}>
                  {roomDone}/{roomTasks.length} {t(lang, "tasks")}
                </p>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div style={{ width: roomTasks.length ? `${(roomDone / roomTasks.length) * 100}%` : 0 }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="stack" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn-primary btn-block" {...press(onShare)}>
          📤 {t(lang, "shareTasks")}
        </button>
        <button type="button" className="btn btn-soft btn-block" {...press(onWorkerMode)}>
          🧕 {t(lang, "workerMode")}
        </button>
      </div>
    </div>
  );
}
