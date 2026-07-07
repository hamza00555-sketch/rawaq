import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import PinModal from "../components/PinModal.jsx";

// In-app worker mode: always dark (violet identity), Filipino task names,
// oversized touch targets, PIN-locked exit.
export default function WorkerScreen({ today, setToday, pin, onExit }) {
  const [exitAsk, setExitAsk] = useState(false);
  const [pinError, setPinError] = useState("");

  const total = today.tasks.length;
  const done = today.tasks.filter((x) => x.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  const toggle = (task) =>
    setToday({
      ...today,
      tasks: today.tasks.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)),
    });

  const tryExit = (value) => {
    if (value === pin) {
      setExitAsk(false);
      setPinError("");
      onExit();
    } else {
      setPinError(t("fil", "wrongPin"));
    }
  };

  return (
    <div className="app rawaq-worker" dir="ltr" lang="fil">
      <div className="screen" style={{ paddingBottom: 30 }}>
        <header className="appbar">
          <h1>{t("fil", "workerHeader")}</h1>
          <button
            type="button"
            className="icon-btn"
            aria-label={t("fil", "exit")}
            {...press(() => {
              setPinError("");
              setExitAsk(true);
            })}
          >
            ✕
          </button>
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
          {today.tasks.map((task) => (
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

      {exitAsk && (
        <PinModal
          title={t("fil", "exitWorkerPin")}
          error={pinError}
          onSubmit={tryExit}
          onCancel={() => setExitAsk(false)}
          cancelLabel={t("fil", "cancel")}
        />
      )}
    </div>
  );
}
