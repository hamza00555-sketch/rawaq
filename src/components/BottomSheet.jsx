import { press } from "../press.js";

export default function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="overlay"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grip" aria-hidden="true" />
        {title && (
          <div className="row spread" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 19 }}>{title}</h2>
            <button type="button" className="icon-btn" aria-label="close" {...press(onClose)}>
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
