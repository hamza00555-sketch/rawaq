import { useEffect } from "react";
import { press } from "../press.js";

// Transient message + optional undo action, pinned above the bottom nav.
export default function Snackbar({ snack, onDismiss }) {
  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [snack, onDismiss]);

  if (!snack) return null;

  return (
    <div className="snackbar" role="status">
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
