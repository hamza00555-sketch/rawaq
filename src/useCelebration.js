import { useEffect, useRef, useState } from "react";

// The "all tasks done" celebration should appear when completion is
// reached, then fade out after a few seconds rather than sitting there
// forever. Re-arms on each fresh rising edge (uncheck → re-complete).
export function useCelebration(active, ms = 7000) {
  const [show, setShow] = useState(false);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active && !wasActive.current) {
      wasActive.current = true;
      setShow(true);
      const timer = setTimeout(() => setShow(false), ms);
      return () => clearTimeout(timer);
    }
    if (!active && wasActive.current) {
      wasActive.current = false;
      setShow(false);
    }
  }, [active, ms]);

  return show;
}
