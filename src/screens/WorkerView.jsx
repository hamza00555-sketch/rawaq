import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import RawaqLogo from "../components/RawaqLogo.jsx";

// Standalone read-only view opened from a #worker= link on the worker's own
// phone. No PIN, no navigation; check state lives only on her device.
export default function WorkerView({ payload }) {
  const [tasks, setTasks] = useState(payload.tasks || []);

  const total = tasks.length;
  const done = tasks.filter((x) => x.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  const toggle = (task) =>
    setTasks(tasks.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)));

  return (
    <div className="app rawaq-worker" dir="ltr" lang="fil">
      <div className="screen" style={{ paddingBottom: 30 }}>
        <header className="appbar">
          <div className="row">
            <RawaqLogo size={38} />
            <div>
              <h1 style={{ fontSize: 20 }}>{t("fil", "workerHeader")}</h1>
              <p className="muted" style={{ fontSize: 13 }}>{payload.date}</p>
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

        <div className="stack">
          {tasks.map((task) => (
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
          ))}
        </div>

        {total > 0 && done === total && (
          <div className="card center-text" style={{ marginTop: 18, color: "var(--primary)", fontWeight: 700, fontSize: 20 }}>
            {t("fil", "allDone")}
          </div>
        )}
      </div>
    </div>
  );
}
