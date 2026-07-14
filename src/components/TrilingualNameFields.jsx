import { useEffect, useRef } from "react";
import { t } from "../i18n.js";
import { homeKey, readActiveHome } from "../homes.js";
import { useAutoTranslate } from "../translate.js";

// Read once per mount (sheets remount per open via key): the active
// home's worker language, picked by mom in Settings. Not reactive.
export function getWorkerLang() {
  try {
    const v = JSON.parse(localStorage.getItem(homeKey(readActiveHome(), "workerLang")));
    return ["ar", "en", "fil", "id"].includes(v) ? v : "fil";
  } catch {
    return "fil";
  }
}

// The name inputs used everywhere a name is typed. Shown: Arabic,
// English, plus the worker's language (Filipino or Indonesian). As mom
// types Arabic, the other fields fill themselves (live, debounced) —
// all three targets are translated and saved even when not shown, so
// switching the worker's language later still finds a translation.
// Touching a field by hand stops the auto-fill for it. Parents key this
// component per open/entity so the manual-edit flags reset with the form.
// initialAr: in edit sheets, translation only kicks in after the Arabic
// name actually changes — unless a shown slot is missing (heal-on-open).
export default function TrilingualNameFields({
  lang,
  ar,
  en,
  fil,
  id = "",
  onAr,
  onEn,
  onFil,
  onId,
  placeholders, // {ar, en, fil, id?} i18n keys
  initialAr = "",
}) {
  const workerLang = useRef(getWorkerLang()).current;
  const manual = useRef({ en: false, fil: false, id: false });
  const lastAr = useRef(ar);

  const values = { en, fil, id };
  const setters = { en: onEn, fil: onFil, id: onId || (() => {}) };

  // A translation slot is "missing" when empty OR still holding the
  // Arabic text (the old save-fallback).
  const missing = (key) => !values[key].trim() || values[key].trim() === ar.trim();

  // If the mom corrected the English by hand, the auto-translation from
  // Arabic was clearly off — so the worker-language field re-translates
  // from her corrected English instead. English becomes the source.
  const fromEnglish = manual.current.en && en.trim().length > 0;

  const needsFill = ["en", "fil", "id"].some((key) => missing(key) && !manual.current[key]);
  const arArmed = !fromEnglish && ar.trim() && (ar.trim() !== initialAr.trim() || needsFill) ? ar : "";
  const tr = useAutoTranslate(arArmed, "ar");

  const enArmed = fromEnglish ? en : "";
  const trEn = useAutoTranslate(enArmed, "en");

  // The Arabic changed → any auto-filled translation is now stale. Clear
  // it (manual text stays) so a failed mid-typing request can never
  // leave a first-word translation stuck next to a longer name; empty
  // fields also tell finalizeName() to retry on the full text at save.
  useEffect(() => {
    if (ar === lastAr.current) return;
    lastAr.current = ar;
    // the parent loading the initial value (edit sheets) is not an edit
    if (!ar.trim() || ar.trim() === initialAr.trim()) return;
    for (const key of ["en", "fil", "id"]) {
      if (!manual.current[key]) setters[key]("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ar]);

  // Arabic-sourced fills (only into missing, non-manual fields).
  useEffect(() => {
    for (const key of ["en", "fil", "id"]) {
      if (tr[key] && !manual.current[key] && missing(key)) setters[key](tr[key]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tr.en, tr.fil, tr.id]);

  // English-sourced fills: the worker-language fields follow the corrected
  // English (overriding a bad Arabic-derived value), unless hand-edited.
  useEffect(() => {
    for (const key of ["fil", "id"]) {
      if (trEn[key] && !manual.current[key]) setters[key](trEn[key]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trEn.fil, trEn.id]);

  const busy = tr.busy || trEn.busy;
  const failed = (arArmed && tr.failed) || (enArmed && trEn.failed);

  const workerInput = (key, placeholderKey) => (
    <input
      className="input"
      dir="ltr"
      value={values[key]}
      onChange={(e) => {
        manual.current[key] = true;
        setters[key](e.target.value);
      }}
      placeholder={t(lang, placeholderKey)}
    />
  );

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
        style={failed && !busy ? { color: "var(--danger)" } : undefined}
      >
        {busy
          ? `🌐 ${t(lang, "translating")}`
          : failed
            ? `🌐 ${t(lang, "translateFailed")}`
            : " "}
      </p>
      {workerInput("en", placeholders.en)}
      {workerLang === "fil" && workerInput("fil", placeholders.fil)}
      {workerLang === "id" && workerInput("id", placeholders.id || placeholders.fil)}
    </>
  );
}
