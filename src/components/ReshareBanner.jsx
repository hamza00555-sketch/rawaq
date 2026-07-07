import { t } from "../i18n.js";
import { press } from "../press.js";

// Soft nudge when today's tasks changed after the last share.
export default function ReshareBanner({ lang, onShare }) {
  return (
    <button type="button" className="reshare-banner" {...press(onShare)}>
      <span aria-hidden="true">🔄</span>
      <span>{t(lang, "tasksChanged")}</span>
    </button>
  );
}
