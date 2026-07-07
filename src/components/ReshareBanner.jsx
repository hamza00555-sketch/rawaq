import { press } from "../press.js";

// One soft banner at a time: visit-today > visit-tomorrow > tasks-changed.
export default function ReshareBanner({ icon, message, onShare }) {
  return (
    <button type="button" className="reshare-banner" {...press(onShare)}>
      <span aria-hidden="true">{icon}</span>
      <span>{message}</span>
    </button>
  );
}
