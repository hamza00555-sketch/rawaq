import { t } from "../i18n.js";
import { press } from "../press.js";

// Floating share button pinned above the bottom nav (Home + Today tabs).
export default function ShareFab({ lang, onShare }) {
  return (
    <button
      type="button"
      className="share-fab"
      aria-label={t(lang, "shareTasks")}
      {...press(onShare)}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 10.7l6.8-4.4M8.6 13.3l6.8 4.4" />
      </svg>
      <span>{t(lang, "shareNow")}</span>
    </button>
  );
}
