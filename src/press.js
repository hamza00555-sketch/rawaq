// Scroll-safe fast tap: arms on pointerdown, fires on pointerup only if the
// finger didn't move (>10px) and the browser didn't claim the gesture for
// scrolling (pointercancel). Starting a scroll on top of a button no longer
// activates it. Keyboard activation kept for accessibility.
export const press = (fn) => ({
  onPointerDown: (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = e.currentTarget;
    el._pressActive = true;
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
    }
  },
  onPointerUp: (e) => {
    const el = e.currentTarget;
    if (!el._pressActive) return;
    el._pressActive = false;
    fn(e);
  },
  onPointerCancel: (e) => {
    e.currentTarget._pressActive = false;
  },
  onPointerLeave: (e) => {
    e.currentTarget._pressActive = false;
  },
  onKeyDown: (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn(e);
    }
  },
});
