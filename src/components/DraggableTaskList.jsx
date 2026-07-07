import { useRef, useState } from "react";

// Gesture state machine — first intent wins:
//   still ≥400ms (within 8px slop) → long-press drag (vibrate + shake)
//   vertical-first move            → native scroll
//   horizontal-first move (≥14px)  → swipe-to-delete (both directions, RTL)
//   none of the above on release   → tap toggle
// Keyboard: Enter/Space toggles, Delete removes.
export default function DraggableTaskList({ tasks, renderName, onToggle, onReorder, onSwipeDelete }) {
  const [dragId, setDragId] = useState(null);
  const [swipe, setSwipe] = useState(null); // {id, dx}
  const timer = useRef(null);
  const start = useRef({ x: 0, y: 0 });
  const intent = useRef("none"); // none | drag | swipe | scroll
  const moved = useRef(false);
  const rowRefs = useRef({});

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const reset = () => {
    clearTimer();
    intent.current = "none";
    setDragId(null);
    setSwipe(null);
  };

  const handleDown = (task) => (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    intent.current = "none";
    moved.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    timer.current = setTimeout(() => {
      if (intent.current !== "none") return;
      navigator.vibrate?.(50);
      intent.current = "drag";
      setDragId(task.id);
    }, 400);
  };

  const handleMove = (task) => (e) => {
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;

    if (intent.current === "drag") {
      const ids = tasks.map((x) => x.id);
      const from = ids.indexOf(dragId);
      let to = from;
      for (const [id, el] of Object.entries(rowRefs.current)) {
        if (!el || id === dragId) continue;
        const rect = el.getBoundingClientRect();
        const idx = ids.indexOf(id);
        if (e.clientY > rect.top && e.clientY < rect.bottom && idx !== -1) to = idx;
      }
      if (to !== from) {
        const next = [...tasks];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onReorder(next);
      }
      return;
    }

    if (intent.current === "swipe") {
      setSwipe({ id: task.id, dx });
      return;
    }

    if (intent.current === "scroll") return;

    // undecided: 8px slop keeps the long-press timer alive through jitter
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    clearTimer();
    moved.current = true;
    if (Math.abs(dy) > Math.abs(dx)) {
      intent.current = "scroll";
      return;
    }
    if (onSwipeDelete && Math.abs(dx) >= 14 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      intent.current = "swipe";
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        // synthetic events (tests) have no active pointer — capture is optional
      }
      setSwipe({ id: task.id, dx });
    }
  };

  const handleUp = (task) => (e) => {
    clearTimer();
    if (intent.current === "swipe" && swipe?.id === task.id) {
      const width = e.currentTarget.offsetWidth || 300;
      if (Math.abs(swipe.dx) >= Math.min(0.35 * width, 120)) onSwipeDelete(task);
    } else if (intent.current === "none" && !moved.current) {
      onToggle(task);
    }
    intent.current = "none";
    setDragId(null);
    setSwipe(null);
  };

  return (
    <ul className="task-list" style={{ listStyle: "none" }}>
      {tasks.map((task) => (
        <li
          key={task.id}
          ref={(el) => (rowRefs.current[task.id] = el)}
          className={`task-row ${task.done ? "done" : ""} ${dragId === task.id ? "dragging" : ""}`}
          style={{ touchAction: dragId ? "none" : "pan-y" }}
          onPointerDown={handleDown(task)}
          onPointerMove={handleMove(task)}
          onPointerUp={handleUp(task)}
          onPointerCancel={reset}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle(task);
            } else if ((e.key === "Delete" || e.key === "Backspace") && onSwipeDelete) {
              e.preventDefault();
              onSwipeDelete(task);
            }
          }}
          tabIndex={0}
          role="checkbox"
          aria-checked={task.done}
        >
          {onSwipeDelete && (
            <span className="swipe-bg" aria-hidden="true">
              <span>🗑</span>
              <span>🗑</span>
            </span>
          )}
          <span
            className="task-row-inner"
            style={{
              transform: swipe?.id === task.id ? `translateX(${swipe.dx}px)` : undefined,
              transition: swipe?.id === task.id ? "none" : undefined,
            }}
          >
            <span className="task-check" aria-hidden="true">✓</span>
            <span className="task-name">{renderName(task)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
