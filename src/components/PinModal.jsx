import { useState } from "react";
import { press } from "../press.js";

// 4-digit numpad. Calls onSubmit(pin) when 4 digits entered; parent decides
// success/failure. `error` triggers the shake + clears via onErrorShown.
export default function PinModal({ title, error, onSubmit, onCancel, cancelLabel }) {
  const [digits, setDigits] = useState("");

  const push = (d) => {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) {
      onSubmit(next);
      setTimeout(() => setDigits(""), 250);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0"];

  return (
    <div className="overlay center">
      <div className={`modal center-text ${error ? "pin-error" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <h2 style={{ fontSize: 19, marginBottom: 4 }}>{title}</h2>
        {error && (
          <p className="muted" role="alert" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        <div className="pin-dots" aria-label={`${digits.length}/4`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`pin-dot ${i < digits.length ? "filled" : ""}`} />
          ))}
        </div>
        <div className="pin-pad">
          {keys.map((k) =>
            k === "⌫" ? (
              <button
                key={k}
                type="button"
                className="pin-key"
                aria-label="backspace"
                {...press(() => setDigits(digits.slice(0, -1)))}
              >
                ⌫
              </button>
            ) : (
              <button key={k} type="button" className="pin-key" {...press(() => push(k))}>
                {k}
              </button>
            )
          )}
          {onCancel ? (
            <button
              type="button"
              className="pin-key"
              style={{ fontSize: 15 }}
              {...press(onCancel)}
            >
              {cancelLabel}
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
