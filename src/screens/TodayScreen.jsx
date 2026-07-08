import { useState } from "react";
import { t } from "../i18n.js";
import { formatDate } from "../data.js";
import { press } from "../press.js";
import DraggableTaskList from "../components/DraggableTaskList.jsx";
import AddTodayTaskSheet from "../components/AddTodayTaskSheet.jsx";
import Snackbar from "../components/Snackbar.jsx";
import Icon from "../components/Icons.jsx";

export default function TodayScreen({ lang, today, setToday, rooms, onFinishVisit }) {
  const [addOpen, setAddOpen] = useState(false);
  const [snack, setSnack] = useState(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const total = today.tasks.length;
  const done = today.tasks.filter((x) => x.done).length;

  const toggle = (task) =>
    setToday({
      ...today,
      tasks: today.tasks.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)),
    });

  // Removing from today only: extras are dropped, room tasks are skipped.
  // Atomic update (skipped + tasks together) so the sync effect stays stable.
  const removeFromToday = (task) => {
    const index = today.tasks.findIndex((x) => x.id === task.id);
    const isExtra = today.extras.some((x) => x.id === task.id);
    setToday({
      ...today,
      skipped: isExtra ? today.skipped : [...today.skipped, task.id],
      extras: isExtra ? today.extras.filter((x) => x.id !== task.id) : today.extras,
      tasks: today.tasks.filter((x) => x.id !== task.id),
    });
    setSnack({
      message: t(lang, "removedFromToday"),
      undoLabel: t(lang, "undo"),
      onUndo: () =>
        setToday((prev) => ({
          ...prev,
          skipped: prev.skipped.filter((id) => id !== task.id),
          extras: isExtra
            ? [...prev.extras, { id: task.id, roomId: task.roomId, name: task.name, freq: task.freq, depth: task.depth }]
            : prev.extras,
          tasks: [...prev.tasks.slice(0, index), task, ...prev.tasks.slice(index)],
        })),
    });
  };

  const addExtra = (extra) => {
    setToday({
      ...today,
      extras: [...today.extras, extra],
      tasks: [...today.tasks, { ...extra, done: false }],
    });
    setSnack({ message: t(lang, "taskAdded") });
  };

  const finish = () => {
    if (!confirmFinish) {
      setConfirmFinish(true);
      setTimeout(() => setConfirmFinish(false), 4000);
      return;
    }
    setConfirmFinish(false);
    onFinishVisit();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2200);
  };

  return (
    <div className="screen">
      <header className="appbar">
        <h1>{t(lang, "todayTasks")}</h1>
        <span className="muted">{formatDate(lang, today.date)}</span>
      </header>

      <p className="muted" style={{ margin: "4px 0 10px" }}>
        {done} {t(lang, "outOf")} {total} {t(lang, "tasksDone")}
      </p>

      <div className="today-list">
        {total === 0 ? (
          <div className="card center-text muted">{t(lang, "noTasks")}</div>
        ) : (
          <DraggableTaskList
            tasks={today.tasks}
            renderName={(task) => (
              <>
                {task.name[lang] || task.name.ar}
                {task.freq === "monthly" && (
                  <span className="task-badge badge-monthly">{t(lang, "monthly")}</span>
                )}
                {task.depth === "deep" && (
                  <span className="task-badge badge-deep">{t(lang, "deep")}</span>
                )}
              </>
            )}
            onToggle={toggle}
            onReorder={(tasks) => setToday({ ...today, tasks })}
            onSwipeDelete={removeFromToday}
          />
        )}
      </div>

      <button type="button" className="btn btn-soft btn-block" style={{ marginTop: 14 }} {...press(() => setAddOpen(true))}>
        <Icon name="plus" size={20} /> {t(lang, "addTodayTask")}
      </button>

      {total > 0 && done === total && (
        <div className="card center-text congrats" style={{ marginTop: 14 }}>
          {t(lang, "allDone")}
        </div>
      )}

      {total > 0 && (
        <button
          type="button"
          className={`btn btn-block ${confirmFinish ? "btn-danger" : "btn-primary"}`}
          style={{ marginTop: 14 }}
          {...press(finish)}
        >
          {savedMsg ? (
            t(lang, "visitSaved")
          ) : confirmFinish ? (
            t(lang, "finishConfirm")
          ) : (
            <>
              <Icon name="check-circle" size={20} /> {t(lang, "finishVisit")}
            </>
          )}
        </button>
      )}

      <AddTodayTaskSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        lang={lang}
        rooms={rooms}
        today={today}
        onAdd={addExtra}
      />

      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />
    </div>
  );
}
