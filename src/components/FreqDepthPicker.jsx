import { t } from "../i18n.js";
import { press } from "../press.js";

// The two independent per-task attributes: frequency + depth.
export default function FreqDepthPicker({ lang, freq, setFreq, depth, setDepth }) {
  return (
    <>
      <span className="muted">{t(lang, "freq")}</span>
      <div className="seg" role="tablist" aria-label={t(lang, "freq")}>
        <button
          type="button"
          role="tab"
          aria-selected={freq === "weekly"}
          className={`seg-btn ${freq === "weekly" ? "active" : ""}`}
          {...press(() => setFreq("weekly"))}
        >
          {t(lang, "weekly")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={freq === "monthly"}
          className={`seg-btn ${freq === "monthly" ? "active" : ""}`}
          {...press(() => setFreq("monthly"))}
        >
          {t(lang, "monthly")}
        </button>
      </div>

      <span className="muted">{t(lang, "cleaningType")}</span>
      <div className="seg" role="tablist" aria-label={t(lang, "cleaningType")}>
        <button
          type="button"
          role="tab"
          aria-selected={depth === "surface"}
          className={`seg-btn ${depth === "surface" ? "active" : ""}`}
          {...press(() => setDepth("surface"))}
        >
          {t(lang, "surface")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={depth === "deep"}
          className={`seg-btn ${depth === "deep" ? "active" : ""}`}
          {...press(() => setDepth("deep"))}
        >
          {t(lang, "deep")}
        </button>
      </div>
    </>
  );
}
