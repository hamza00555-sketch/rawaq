import { useEffect, useRef } from "react";
import { t } from "../i18n.js";
import { useAutoTranslate } from "../translate.js";

// The ar/en/fil name inputs used everywhere a name is typed. As mom
// types Arabic, the English and Filipino fields fill themselves (live,
// debounced); touching either field by hand stops the auto-fill for it.
// Parents should key this component per open/entity so the manual-edit
// flags reset with the form.
// initialAr: in edit sheets, translation only kicks in after the Arabic
// name actually changes — opening a task must not clobber its names.
export default function TrilingualNameFields({
  lang,
  ar,
  en,
  fil,
  onAr,
  onEn,
  onFil,
  placeholders, // {ar, en, fil} i18n keys
  initialAr = "",
}) {
  const manualEn = useRef(false);
  const manualFil = useRef(false);
  const lastAr = useRef(ar);

  // A translation slot is "missing" when empty OR still holding the
  // Arabic text (the old save-fallback). Rooms/tasks saved before the
  // translator existed — or while it was unreachable — get auto-filled
  // the moment their edit sheet opens, not only after the name changes.
  const missing = (v) => !v.trim() || v.trim() === ar.trim();
  const needsFill =
    (missing(en) && !manualEn.current) || (missing(fil) && !manualFil.current);
  const armed = ar.trim() && (ar.trim() !== initialAr.trim() || needsFill) ? ar : "";
  const tr = useAutoTranslate(armed);

  // The Arabic changed → any auto-filled translation is now stale. Clear
  // it (manual text stays) so a failed mid-typing request can never
  // leave a first-word translation stuck next to a longer name; empty
  // fields also tell finalizeName() to retry on the full text at save.
  useEffect(() => {
    if (ar === lastAr.current) return;
    lastAr.current = ar;
    // the parent loading the initial value (edit sheets) is not an edit
    if (!ar.trim() || ar.trim() === initialAr.trim()) return;
    if (!manualEn.current) onEn("");
    if (!manualFil.current) onFil("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ar]);

  useEffect(() => {
    if (tr.en && !manualEn.current && missing(en)) onEn(tr.en);
    if (tr.fil && !manualFil.current && missing(fil)) onFil(tr.fil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tr.en, tr.fil]);

  return (
    <>
      <input
        className="input"
        dir="rtl"
        value={ar}
        onChange={(e) => onAr(e.target.value)}
        placeholder={t(lang, placeholders.ar)}
      />
      <p
        className="muted translate-hint"
        role="status"
        aria-live="polite"
        style={tr.failed && !tr.busy ? { color: "var(--danger)" } : undefined}
      >
        {tr.busy
          ? `🌐 ${t(lang, "translating")}`
          : tr.failed && armed
            ? `🌐 ${t(lang, "translateFailed")}`
            : " "}
      </p>
      <input
        className="input"
        dir="ltr"
        value={en}
        onChange={(e) => {
          manualEn.current = true;
          onEn(e.target.value);
        }}
        placeholder={t(lang, placeholders.en)}
      />
      <input
        className="input"
        dir="ltr"
        value={fil}
        onChange={(e) => {
          manualFil.current = true;
          onFil(e.target.value);
        }}
        placeholder={t(lang, placeholders.fil)}
      />
    </>
  );
}
