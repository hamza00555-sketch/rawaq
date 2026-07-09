import { useEffect, useState } from "react";
import { t, WORKER_LANGS } from "../i18n.js";
import { formatDate } from "../data.js";
import { press } from "../press.js";
import { fetchShare, updateShareTasks } from "../shares.js";
import { roomDone } from "../houseMap.js";
import HouseMap from "../components/HouseMap.jsx";
import RawaqLogo from "../components/RawaqLogo.jsx";
import Icon from "../components/Icons.jsx";

// Standalone view on the worker's own phone, opened via a short #w= link
// (or a legacy #worker= payload). Her checkmarks are written back to the
// share doc so mom follows along live; reload restores them from the doc.
export default function WorkerView({ payload, shortId }) {
  const [tasks, setTasks] = useState(payload?.tasks || []);
  const [date, setDate] = useState(payload?.date || "");
  const [roomsMeta, setRoomsMeta] = useState(payload?.rooms || null);
  const [status, setStatus] = useState(payload ? "ready" : "loading");
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  useEffect(() => {
    if (!shortId) return;
    let cancelled = false;
    fetchShare(shortId)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setTasks(data.tasks || []);
          setDate(data.date || "");
          setRoomsMeta(data.rooms && Object.keys(data.rooms).length ? data.rooms : null);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [shortId]);

  // Display language mom picked in Settings, carried in the share doc.
  // Legacy shares / payloads without __prefs default to Filipino.
  const wlang = (roomsMeta?.__prefs?.lang && WORKER_LANGS[roomsMeta.__prefs.lang]) ? roomsMeta.__prefs.lang : "fil";
  const wdir = WORKER_LANGS[wlang].dir;
  const tw = (key) => t(wlang, key);
  const nm = (name) => name[wlang] || name.fil || name.ar;

  const total = tasks.length;
  const done = tasks.filter((x) => x.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;

  const toggle = (task) => {
    const next = tasks.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x));
    setTasks(next);
    if (shortId) updateShareTasks(shortId, next).catch(() => {});
  };

  if (status !== "ready") {
    return (
      <div className="app rawaq-worker" dir="ltr" lang="fil">
        <div className="screen center-text" style={{ paddingTop: 120 }}>
          <div className="stack" style={{ alignItems: "center" }}>
            <RawaqLogo size={72} />
            <p className="muted" role="status" style={{ fontSize: 18 }}>
              {status === "loading" ? t("fil", "loadingTasks") : t("fil", "linkError")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group by room when the payload carries room meta; flat list otherwise.
  // Groups follow mom's priority order (older shares have no priority —
  // insertion order stands in). "Other" tasks always come last.
  const groups = roomsMeta
    ? (() => {
        const byRoom = new Map();
        for (const task of tasks) {
          const key = task.roomId && roomsMeta[task.roomId] ? task.roomId : "__other";
          if (!byRoom.has(key)) byRoom.set(key, []);
          byRoom.get(key).push(task);
        }
        return [...byRoom.entries()]
          .map(([roomId, list]) => ({
            roomId,
            meta: roomsMeta[roomId],
            tasks: list,
          }))
          .sort(
            (a, b) =>
              (a.meta ? (a.meta.priority ?? 999) : 1000) - (b.meta ? (b.meta.priority ?? 999) : 1000)
          );
      })()
    : [{ roomId: "__all", meta: null, tasks }];

  // The map appears when the share carries block layouts. A block goes
  // green live as its room's tasks complete (the same tasks state that
  // syncs back to mom); rooms with no tasks today are dimmed.
  const hasMap = roomsMeta && Object.values(roomsMeta).some((m) => m.layout);
  const gridCols = roomsMeta?.__grid?.cols || 6;
  const gridRows = roomsMeta?.__grid?.rows || 8;
  const mapEntries = hasMap
    ? Object.entries(roomsMeta)
        .filter(([, m]) => m.layout)
        .map(([roomId, m]) => ({
          id: roomId,
          rect: m.layout,
          emoji: m.emoji,
          name: nm(m.name),
          type: m.type || "general",
          priority: m.priority,
          done: roomDone(tasks, roomId),
          dimmed: m.type !== "hall" && !tasks.some((x) => x.roomId === roomId),
        }))
    : [];

  const shownGroups = selectedRoomId
    ? groups.filter((g) => g.roomId === selectedRoomId)
    : groups;

  const renderTask = (task) => (
    <button
      key={task.id}
      type="button"
      className={`worker-task ${task.done ? "done" : ""}`}
      aria-pressed={task.done}
      {...press(() => toggle(task))}
    >
      <span className="task-check" aria-hidden="true">
        <Icon name="check" size="0.75em" strokeWidth={3} style={{ verticalAlign: 0 }} />
      </span>
      <span className="task-name">{nm(task.name)}</span>
    </button>
  );

  return (
    <div className="app rawaq-worker" dir={wdir} lang={wlang === "fil" ? "fil" : wlang}>
      <div className="screen" style={{ paddingBottom: 30 }}>
        <header className="appbar">
          <div className="row">
            <RawaqLogo size={38} />
            <div>
              <h1 style={{ fontSize: 20 }}>{tw("workerHeader")}</h1>
              <p className="muted" style={{ fontSize: 13 }}>{date ? formatDate(wlang, date) : ""}</p>
            </div>
          </div>
        </header>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="row spread" style={{ marginBottom: 10 }}>
            <strong style={{ fontSize: 18 }}>{tw("progress")}</strong>
            <strong style={{ fontSize: 18, color: "var(--primary)" }}>
              {done}/{total} · {percent}%
            </strong>
          </div>
          <div className="progress-bar" style={{ height: 14 }}>
            <div style={{ width: `${percent}%` }} />
          </div>
        </div>

        {complete && (
          <div className="card center-text congrats celebrate-pop" style={{ marginBottom: 18, fontSize: 22 }} role="status">
            {tw("workerCongrats")}
          </div>
        )}

        {hasMap && (
          <div style={{ marginBottom: 18 }}>
            <HouseMap
              entries={mapEntries}
              cols={gridCols}
              rows={gridRows}
              selectedId={selectedRoomId}
              onTapRoom={(id) => setSelectedRoomId(id === selectedRoomId ? null : id)}
            />
            <p className="muted center-text" style={{ fontSize: 13, marginTop: 8 }}>
              {tw("tapRoomOnMap")}
            </p>
          </div>
        )}

        {selectedRoomId && (
          <button
            type="button"
            className="btn btn-soft"
            style={{ marginBottom: 12 }}
            {...press(() => setSelectedRoomId(null))}
          >
            <Icon name="chevron-left" size={18} /> {tw("allRooms")}
          </button>
        )}

        <div className="stack">
          {shownGroups.map((group) =>
            group.meta || group.roomId === "__other" ? (
              <section key={group.roomId} className="stack" style={{ gap: 10 }}>
                <h2 className="worker-group-title">
                  {group.meta ? `${group.meta.emoji} ${nm(group.meta.name)}` : tw("otherTasks")}
                </h2>
                {group.tasks.map(renderTask)}
              </section>
            ) : (
              group.tasks.map(renderTask)
            )
          )}
        </div>
      </div>
    </div>
  );
}
