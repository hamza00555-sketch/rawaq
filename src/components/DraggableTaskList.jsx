import { useRef, useState } from "react";
import { press } from "../press.js";

// Long-press (400ms) starts drag: device vibration + CSS shake, then pointer
// movement reorders. A quick tap toggles the task instead.
export default function DraggableTaskList({ tasks, renderName, onToggle, onReorder, onDelete }) {
  const [dragId, setDragId] = useState(null);
  const timer = useRef(null);
  const moved = useRef(false);
  const rowRefs = useRef({});

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const startPress = (task) => (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    moved.current = false;
    timer.current = setTimeout(() => {
      navigator.vibrate?.(50);
      setDragId(task.id);
    }, 400);
  };

  const handleMove = (e) => {
    if (!dragId) {
      moved.current = true;
      clearTimer();
      return;
    }
    const y = e.clientY;
    const ids = tasks.map((x) => x.id);
    const from = ids.indexOf(dragId);
    let to = from;
    for (const [id, el] of Object.entries(rowRefs.current)) {
      if (!el || id === dragId) continue;
      const rect = el.getBoundingClientRect();
      const idx = ids.indexOf(id);
      if (y > rect.top && y < rect.bottom && idx !== -1) to = idx;
    }
    if (to !== from) {
      const next = [...tasks];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onReorder(next);
    }
  };

  const endPress = (task) => () => {
    const wasDragging = dragId !== null;
    clearTimer();
    setDragId(null);
    if (!wasDragging && !moved.current) onToggle(task);
  };

  return (
    <ul className="task-list" style={{ listStyle: "none", touchAction: dragId ? "none" : "auto" }}>
      {tasks.map((task) => (
        <li
          key={task.id}
          ref={(el) => (rowRefs.current[task.id] = el)}
          className={`task-row ${task.done ? "done" : ""} ${dragId === task.id ? "dragging" : ""}`}
          onPointerDown={startPress(task)}
          onPointerMove={handleMove}
          onPointerUp={endPress(task)}
          onPointerCancel={() => {
            clearTimer();
            setDragId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle(task);
            }
          }}
          tabIndex={0}
          role="checkbox"
          aria-checked={task.done}
        >
          <span className="task-check" aria-hidden="true">✓</span>
          <span className="task-name">{renderName(task)}</span>
          {onDelete && (
            <button
              type="button"
              className="icon-btn"
              style={{ minWidth: 40, minHeight: 40, color: "var(--danger)" }}
              aria-label="delete"
              {...press((e) => {
                e.stopPropagation();
                onDelete(task);
              })}
            >
              🗑
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
