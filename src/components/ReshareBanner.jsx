import { press } from "../press.js";
import Icon from "./Icons.jsx";

// One soft banner at a time: visit-today > visit-tomorrow > tasks-changed.
export default function ReshareBanner({ icon, message, onShare }) {
  return (
    <button type="button" className="reshare-banner" {...press(onShare)}>
      <Icon name={icon} size={18} />
      <span>{message}</span>
    </button>
  );
}
