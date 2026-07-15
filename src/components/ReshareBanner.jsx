import { useEffect, useRef, useState } from "react";
import { press } from "../press.js";
import Icon from "./Icons.jsx";

// One soft banner at a time: visit-today > visit-tomorrow > tasks-changed.
// It dismisses itself after 5s or when swiped up, and re-arms whenever the
// message changes. Tapping it still opens the share sheet.
export default function ReshareBanner({ icon, message, onShare }) {
  const [hidden, setHidden] = useState(false);
  const startY = useRef(null);

  useEffect(() => {
    setHidden(false);
    const timer = setTimeout(() => setHidden(true), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  if (hidden) return null;

  const tap = press(onShare);
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
        if (startY.current != null && startY.current - e.clientY > 35) setHidden(true);
        tap.onPointerMove(e);
      }}
    >
      <Icon name={icon} size={18} />
      <span>{message}</span>
    </button>
  );
}
