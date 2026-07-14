// Scroll-safe fast tap: arms on pointerdown, fires on pointerup only if the
// finger didn't move (>10px) and the browser didn't claim the gesture for
// scrolling (pointercancel). Starting a scroll on top of a button no longer
// activates it. Keyboard activation kept for accessibility.
//
// Android Chrome fires pointercancel/pointerleave far more eagerly than iOS —
// it speculatively cancels the pointer even on a clean tap — which would make
// the pointerup path miss and the button feel dead. So we ALSO fire on the
// native `click` event (a real tap always produces one; a scroll never does),
// guarded so a tap fires `fn` exactly once whichever path delivers it.
export const press = (fn) => ({
  onPointerDown: (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = e.currentTarget;
    el._pressActive = true;
    el._pressDone = false; // fn already fired for this interaction?
    el._pressMoved = false;
    el._pressX = e.clientX;
    el._pressY = e.clientY;
  },
  onPointerMove: (e) => {
    const el = e.currentTarget;
    if (
      el._pressActive &&
      (Math.abs(e.clientX - el._pressX) > 10 || Math.abs(e.clientY - el._pressY) > 10)
    ) {
      el._pressActive = false;
      el._pressMoved = true;
    }
  },
  onPointerUp: (e) => {
    const el = e.currentTarget;
    if (!el._pressActive) return;
    el._pressActive = false;
    el._pressDone = true;
    fn(e);
  },
  onPointerCancel: (e) => {
    e.currentTarget._pressActive = false;
  },
  onPointerLeave: (e) => {
    e.currentTarget._pressActive = false;
  },
  // Fallback: the native click of a real tap. Skip it when pointerup already
  // fired (no double), or when the gesture moved (a scroll, not a tap).
  onClick: (e) => {
    const el = e.currentTarget;
    if (el._pressDone) {
      el._pressDone = false;
      return;
    }
    if (el._pressMoved) {
      el._pressMoved = false;
      return;
    }
    fn(e);
  },
  onKeyDown: (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget._pressDone = true; // suppress the synthesized click
      fn(e);
    }
  },
});
