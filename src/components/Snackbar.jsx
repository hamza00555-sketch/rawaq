import { useEffect, useRef } from "react";
import { press } from "../press.js";

// Transient message + optional undo action, pinned above the bottom nav.
// Auto-hides after 5s, or dismiss early by swiping it up.
export default function Snackbar({ snack, onDismiss }) {
  const startY = useRef(null);
  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [snack, onDismiss]);

  if (!snack) return null;

  return (
    <div
      className="snackbar"
      role="status"
      onPointerDown={(e) => {
        startY.current = e.clientY;
        try {
          e.currentTarget.setPointerCapture?.(e.pointerId);
        } catch {
          // synthetic events have no active pointer — capture is optional
        }
      }}
      onPointerMove={(e) => {
        if (startY.current != null && startY.current - e.clientY > 35) {
          startY.current = null;
          onDismiss();
        }
      }}
    >
      <span>{snack.message}</span>
      {snack.onUndo && (
        <button
          type="button"
          className="snackbar-undo"
          {...press(() => {
            snack.onUndo();
            onDismiss();
          })}
        >
          {snack.undoLabel}
        </button>
      )}
    </div>
  );
}
