// Tablet requirement: interactive elements respond on pointerdown, not click.
// Keyboard activation is kept for accessibility.
export const press = (fn) => ({
  onPointerDown: (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    fn(e);
  },
  onKeyDown: (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn(e);
    }
  },
});
