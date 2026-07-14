import { useEffect, useRef } from "react";
import Icon from "./Icons.jsx";

export default function BottomSheet({ open, onClose, title, children }) {
  // On mobile, the tap that opens the sheet fires a delayed "ghost click"
  // once the overlay has rendered. If the opening button sat where the
  // backdrop now is (e.g. a top-of-screen button), that stray click would
  // close the sheet the instant it opened. Ignore backdrop dismissal for a
  // short window after opening so only a deliberate later tap closes it.
  const openedAt = useRef(0);
  useEffect(() => {
    if (open) openedAt.current = performance.now();
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && performance.now() - openedAt.current > 350) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grip" aria-hidden="true" />
        {title && (
          <div className="row spread" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 19 }}>{title}</h2>
            <button type="button" className="icon-btn" aria-label="close" onClick={onClose}>
              <Icon name="x" size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
