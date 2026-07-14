import { useMemo, useState } from "react";
import { t } from "../i18n.js";
import { formatDate } from "../data.js";
import { press } from "../press.js";
import { isHall, mapDims, roomDone, sanitizeMap } from "../houseMap.js";
import { useCelebration } from "../useCelebration.js";
import ProgressRing from "../components/ProgressRing.jsx";
import HouseMap from "../components/HouseMap.jsx";
import RawaqLogo from "../components/RawaqLogo.jsx";
import CreateTaskSheet from "../components/CreateTaskSheet.jsx";
import HomeSwitcher from "../components/HomeSwitcher.jsx";
import Snackbar from "../components/Snackbar.jsx";
import Icon from "../components/Icons.jsx";

export default function HomeScreen({
  lang,
  owner,
  today,
  rooms,
  setRooms,
  houseMap,
  history,
  onShare,
  onOpenMap,
  nextVisit,
  homes,
  activeHome,
  onSwitchHome,
  onAddHome,
  onRenameHome,
  onDeleteHome,
  onLinkHome,
  onJoinHome,
  onUnlinkHome,
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [homesOpen, setHomesOpen] = useState(false);
  const [snack, setSnack] = useState(null);

  const currentHome = homes?.find((h) => h.id === activeHome);
  const multiHome = homes && homes.length > 1;

  const total = today.tasks.length;
  const done = today.tasks.filter((x) => x.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  const celebrate = useCelebration(complete);
  const lastVisit = history[history.length - 1];

  // Mom's own live map preview: same read-only renderer the worker sees,
  // in her UI language. A room greens when all its today-tasks are done;
  // rooms with no tasks today are dimmed. Shown only once she's placed
  // rooms on the map.
  const map = useMemo(() => sanitizeMap(houseMap, rooms), [houseMap, rooms]);
  const { cols, rows } = mapDims(map);
  const nm = (name) => name[lang] || name.ar;
  const mapEntries = [
    ...rooms
      .filter((r) => map.blocks[r.id])
      .map((r) => ({
        id: r.id,
        rect: map.blocks[r.id],
        emoji: r.emoji,
        name: nm(r.name),
        type: r.type,
        priority: rooms.indexOf(r) + 1,
        done: roomDone(today.tasks, r.id),
        dimmed: !today.tasks.some((x) => x.roomId === r.id),
      })),
    ...Object.keys(map.blocks)
      .filter(isHall)
      .map((id) => ({ id, rect: map.blocks[id], emoji: "", name: t(lang, "hall"), type: "hall" })),
  ];
  const hasMap = mapEntries.some((e) => e.type !== "hall");

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
        {homes && (
          <button
            type="button"
            className="home-switch-btn"
            aria-label={t(lang, "myHomes")}
            {...press(() => setHomesOpen(true))}
          >
            <Icon name="home" size={18} />
            <span>{currentHome?.name || t(lang, "myHomes")}</span>
            {multiHome && <Icon name="chevron-down" size={16} />}
          </button>
        )}
      </header>

      {/* Compact progress summary — a small ring beside the counts so the
          map below is the focus. */}
      <section className="card home-summary" aria-label={t(lang, "todayProgress")}>
        <ProgressRing percent={percent} size={72} celebrate={complete} compact />
        <div className="home-summary-text">
          <strong style={{ fontSize: 15 }}>{t(lang, "todayProgress")}</strong>
          <p className="muted" style={{ fontSize: 14 }}>
            {done} {t(lang, "outOf")} {total} {t(lang, "tasksDone")}
          </p>
          {nextVisit && (
            <span className="muted" style={{ fontSize: 13 }}>
              <Icon name="calendar" size={14} /> {t(lang, "nextVisit")}: {formatDate(lang, nextVisit)}
            </span>
          )}
        </div>
      </section>

      {celebrate && (
        <div className="card center-text congrats celebrate-pop" role="status" style={{ marginTop: 14 }}>
          <img src="/illustrations/celebrate.webp" alt="" className="celebrate-illus" />
          <p>{t(lang, "congrats100")}</p>
        </div>
      )}

      {hasMap && (
        <section className="card" style={{ marginTop: 14 }} aria-label={t(lang, "houseMap")}>
          <div className="row spread" style={{ marginBottom: 10 }}>
            <strong>{t(lang, "houseMap")}</strong>
            <button type="button" className="icon-btn" aria-label={t(lang, "houseMap")} {...press(onOpenMap)}>
              <Icon name="pencil" size={18} />
            </button>
          </div>
          <HouseMap entries={mapEntries} cols={cols} rows={rows} fit />
        </section>
      )}

      <div className="stack" style={{ marginTop: 16 }}>
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

      {homes && (
        <HomeSwitcher
          open={homesOpen}
          onClose={() => setHomesOpen(false)}
          lang={lang}
          homes={homes}
          activeHome={activeHome}
          onSwitch={onSwitchHome}
          onAdd={onAddHome}
          onRename={onRenameHome}
          onDelete={onDeleteHome}
          onLink={onLinkHome}
          onJoin={onJoinHome}
          onUnlink={onUnlinkHome}
        />
      )}

      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
    </div>
  );
}
