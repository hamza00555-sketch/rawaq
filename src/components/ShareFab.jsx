import { t } from "../i18n.js";
import { press } from "../press.js";
import Icon from "./Icons.jsx";

// Floating share button pinned above the bottom nav (Home + Today tabs).
export default function ShareFab({ lang, onShare }) {
  return (
    <button
      type="button"
      className="share-fab"
      aria-label={t(lang, "shareTasks")}
      {...press(onShare)}
    >
      <Icon name="share" size={22} />
      <span>{t(lang, "shareNow")}</span>
    </button>
  );
}
