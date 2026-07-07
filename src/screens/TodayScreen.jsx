import { useState } from "react";
import { t } from "../i18n.js";
import { press } from "../press.js";
import { todayStr } from "../data.js";
import DraggableTaskList from "../components/DraggableTaskList.jsx";

export default function TodayScreen({ lang, today, setToday, onFinishVisit }) {
  // ar/fil display toggle (independent of app language)
  const [nameLang, setNameLang] = useState(lang === "fil" ? "fil" : "ar");
  const [savedMsg, setSavedMsg] = useState(false);

  const total = today.tasks.length;
  const done = today.tasks.filter((x) => x.done).length;

  const toggle = (task) =>
    setToday({
      ...today,
      tasks: today.tasks.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)),
    });

  const setMode = (mode) => {
    if (mode !== today.mode) setToday({ ...today, mode, date: "" }); // date reset triggers rebuild in App
  };

  const finish = () => {
    onFinishVisit();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2200);
  };

  return (
    <div className="screen">
      <header className="appbar">
        <h1>{t(lang, "todayTasks")}</h1>
        <span className="muted">{todayStr()}</span>
      </header>

      <div className="stack">
        <div className="seg" role="tablist" aria-label={t(lang, "theme")}>
          <button
            type="button"
            role="tab"
            aria-selected={today.mode === "surface"}
            className={`seg-btn ${today.mode === "surface" ? "active" : ""}`}
            {...press(() => setMode("surface"))}
          >
            {t(lang, "surface")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={today.mode === "deep"}
            className={`seg-btn ${today.mode === "deep" ? "active" : ""}`}
            {...press(() => setMode("deep"))}
          >
            {t(lang, "deep")}
          </button>
        </div>

        <div className="seg" role="tablist" aria-label={t(lang, "language")}>
          <button
            type="button"
            role="tab"
            aria-selected={nameLang === "ar"}
            className={`seg-btn ${nameLang === "ar" ? "active" : ""}`}
            {...press(() => setNameLang("ar"))}
          >
            🇸🇦 {t(lang, "showAr")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={nameLang === "fil"}
            className={`seg-btn ${nameLang === "fil" ? "active" : ""}`}
            {...press(() => setNameLang("fil"))}
          >
            🇵🇭 {t(lang, "showFil")}
          </button>
        </div>
      </div>

      <p className="muted" style={{ margin: "14px 0 10px" }}>
        {done} {t(lang, "outOf")} {total} {t(lang, "tasksDone")} · {t(lang, "dragHint")}
      </p>

      {total === 0 ? (
        <div className="card center-text muted">{t(lang, "noTasks")}</div>
      ) : (
        <DraggableTaskList
          tasks={today.tasks}
          renderName={(task) => task.name[nameLang] || task.name.ar}
          onToggle={toggle}
          onReorder={(tasks) => setToday({ ...today, tasks })}
        />
      )}

      {total > 0 && done === total && (
        <div className="card center-text" style={{ marginTop: 16, color: "var(--primary)", fontWeight: 600 }}>
          {t(lang, "allDone")}
        </div>
      )}

      {total > 0 && (
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 20 }} {...press(finish)}>
          {savedMsg ? t(lang, "visitSaved") : `✅ ${t(lang, "finishVisit")}`}
        </button>
      )}
    </div>
  );
}
