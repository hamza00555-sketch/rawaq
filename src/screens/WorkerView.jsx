import { useEffect, useState } from "react";
import { t } from "../i18n.js";
import { formatDate } from "../data.js";
import { press } from "../press.js";
import { fetchShare, updateShareTasks } from "../shares.js";
import RawaqLogo from "../components/RawaqLogo.jsx";

// Standalone view on the worker's own phone, opened via a short #w= link
// (or a legacy #worker= payload). Her checkmarks are written back to the
// share doc so mom follows along live; reload restores them from the doc.
export default function WorkerView({ payload, shortId }) {
  const [tasks, setTasks] = useState(payload?.tasks || []);
  const [date, setDate] = useState(payload?.date || "");
  const [roomsMeta, setRoomsMeta] = useState(payload?.rooms || null);
  const [status, setStatus] = useState(payload ? "ready" : "loading");

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
  const groups = roomsMeta
    ? (() => {
        const byRoom = new Map();
        for (const task of tasks) {
          const key = task.roomId && roomsMeta[task.roomId] ? task.roomId : "__other";
          if (!byRoom.has(key)) byRoom.set(key, []);
          byRoom.get(key).push(task);
        }
        return [...byRoom.entries()].map(([roomId, list]) => ({
          roomId,
          meta: roomsMeta[roomId],
          tasks: list,
        }));
      })()
    : [{ roomId: "__all", meta: null, tasks }];

  const renderTask = (task) => (
    <button
      key={task.id}
      type="button"
      className={`worker-task ${task.done ? "done" : ""}`}
      aria-pressed={task.done}
      {...press(() => toggle(task))}
    >
      <span className="task-check" aria-hidden="true">✓</span>
      <span className="task-name">{task.name.fil || task.name.ar}</span>
    </button>
  );

  return (
    <div className="app rawaq-worker" dir="ltr" lang="fil">
      <div className="screen" style={{ paddingBottom: 30 }}>
        <header className="appbar">
          <div className="row">
            <RawaqLogo size={38} />
            <div>
              <h1 style={{ fontSize: 20 }}>{t("fil", "workerHeader")}</h1>
              <p className="muted" style={{ fontSize: 13 }}>{date ? formatDate("fil", date) : ""}</p>
            </div>
          </div>
        </header>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="row spread" style={{ marginBottom: 10 }}>
            <strong style={{ fontSize: 18 }}>{t("fil", "progress")}</strong>
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
            {t("fil", "workerCongrats")}
          </div>
        )}

        <div className="stack">
          {groups.map((group) =>
            group.meta || group.roomId === "__other" ? (
              <section key={group.roomId} className="stack" style={{ gap: 10 }}>
                <h2 className="worker-group-title">
                  {group.meta ? `${group.meta.emoji} ${group.meta.name.fil || group.meta.name.ar}` : t("fil", "otherTasks")}
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
