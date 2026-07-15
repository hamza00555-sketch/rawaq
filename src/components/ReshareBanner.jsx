import { useEffect, useRef } from "react";
import { press } from "../press.js";
import Icon from "./Icons.jsx";

// One soft banner at a time: visit-today > visit-tomorrow > tasks-changed.
// It shows once per event: after 5s, a swipe up, or a tap, it tells the
// parent it was seen (which records the event key and stops re-showing it on
// every return to Home). Tapping it also opens the share sheet.
export default function ReshareBanner({ icon, message, onShare, onDismiss }) {
  const startY = useRef(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => dismiss.current(), 5000);
    return () => clearTimeout(timer);
  }, []);

  const tap = press(() => {
    onShare();
    dismiss.current();
  });

  return (
    <button
      type="button"
      className="reshare-banner"
      {...tap}
      onPointerDown={(e) => {
        startY.current = e.clientY;
        try {
          e.currentTarget.setPointerCapture?.(e.pointerId);
        } catch {
          // synthetic events have no active pointer — capture is optional
        }
        tap.onPointerDown(e);
      }}
      onPointerMove={(e) => {
        if (startY.current != null && startY.current - e.clientY > 35) {
          startY.current = null;
          dismiss.current();
        }
        tap.onPointerMove(e);
      }}
    >
      <Icon name={icon} size={18} />
      <span>{message}</span>
    </button>
  );
}
