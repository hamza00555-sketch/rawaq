// Android hardware/gesture back button → navigate *within* the app instead of
// closing the whole PWA. Every closable layer (a sheet, a full-screen
// sub-view, a non-home tab) registers a close handler and pushes one history
// entry while it's open. Pressing back pops exactly one layer — the topmost —
// and only exits the app once nothing is left to close.
//
// Both the hardware back button and an in-app close button funnel through the
// same history entry, so they stay perfectly balanced: a UI close removes its
// own history entry, and a back press closes the top layer without leaving a
// dangling entry behind.
import { useEffect, useRef } from "react";

// Stack of open layers, oldest first. Each entry: { id, close }.
let stack = [];
// Number of history pops we triggered ourselves (via an in-app close), which
// must NOT be treated as a user "back" press.
let selfPops = 0;
let installed = false;

function ensureInstalled() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("popstate", () => {
    if (selfPops > 0) {
      selfPops--; // this pop was our own history.back() from an in-app close
      return;
    }
    // A real back press: close the topmost open layer.
    const layer = stack.pop();
    if (layer) layer.close();
    // If the stack was empty, the browser already navigated back — that's the
    // intended "exit the app" behavior when nothing is open.
  });
}

function pushLayer(id, close) {
  ensureInstalled();
  stack.push({ id, close });
  window.history.pushState({ rawaqLayer: true }, "");
}

function removeLayer(id) {
  const idx = stack.findIndex((l) => l.id === id);
  if (idx === -1) return; // already removed by a back press — nothing to undo
  stack.splice(idx, 1);
  // Balance history: drop the entry we pushed, without treating the resulting
  // popstate as a user back press.
  selfPops++;
  window.history.back();
}

let counter = 0;

// Register `onClose` as the handler for the Android back button while `isOpen`
// is true. No-op on the server / when there's no history API.
export function useBackClose(isOpen, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !window.history) return;
    const id = ++counter;
    pushLayer(id, () => closeRef.current && closeRef.current());
    return () => removeLayer(id);
  }, [isOpen]);
}
