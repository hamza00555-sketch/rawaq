import { useEffect, useState } from "react";

// Live Arabic → English/Filipino translation for names mom types.
// Primary: Google's free gtx endpoint (no key, CORS *). Fallback:
// MyMemory (also keyless + CORS *). Results are cached in localStorage
// so repeat names are instant and survive offline. Both can fail (no
// network, quota) — callers treat translations as best-effort and fall
// back to the Arabic text, exactly like before this feature.

const CACHE_KEY = "rawaq_tr_cache";
const CACHE_MAX = 300;

let mem = null;
function cache() {
  if (!mem) {
    try {
      mem = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    } catch {
      mem = {};
    }
  }
  return mem;
}

function remember(key, value) {
  const c = cache();
  c[key] = value;
  const keys = Object.keys(c);
  // object insertion order ≈ oldest first; trim the front when over cap
  for (let i = 0; i < keys.length - CACHE_MAX; i++) delete c[keys[i]];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    // storage full — cache stays in-memory only
  }
}

// A hung request on flaky mobile networks must not wedge the whole flow.
const fetchOpts = () =>
  typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? { signal: AbortSignal.timeout(7000) }
    : {};

async function viaGoogle(text, target, source) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, fetchOpts());
  if (!res.ok) throw new Error(`gtx ${res.status}`);
  const data = await res.json();
  const out = (data?.[0] || [])
    .map((seg) => seg?.[0] || "")
    .join("")
    .trim();
  if (!out) throw new Error("gtx empty");
  return out;
}

async function viaMyMemory(text, target, source) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
  const res = await fetch(url, fetchOpts());
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText?.trim();
  if (!out || data?.responseStatus !== 200 || /QUERY LENGTH|INVALID/i.test(out)) {
    throw new Error("mymemory empty");
  }
  return out;
}

async function translateTo(text, target, source) {
  try {
    return await viaGoogle(text, target, source);
  } catch {
    return await viaMyMemory(text, target, source);
  }
}

// The three name fields and their upstream locale codes.
const FIELD_LOCALE = { en: "en", fil: "tl", id: "id" };

// Translate `text` FROM `source` (ar|en|tl|id) into {en, fil, id}. The
// field matching the source is passed through unchanged (no self-
// translate). Any target may be "" on failure. Cached per source+text.
export async function translateName(text, source = "ar") {
  const key = text.trim();
  if (!key) return { en: "", fil: "", id: "" };
  const ck = source === "ar" ? key : `${source}|${key}`;
  const hit = cache()[ck];
  if (hit && hit.id !== undefined) return hit;
  const fields = ["en", "fil", "id"];
  const parts = await Promise.allSettled(
    fields.map((f) =>
      FIELD_LOCALE[f] === source ? Promise.resolve(key) : translateTo(key, FIELD_LOCALE[f], source)
    )
  ).then((r) => r.map((x) => (x.status === "fulfilled" ? x.value : "")));
  const result = { en: parts[0], fil: parts[1], id: parts[2] };
  if (result.en && result.fil && result.id) remember(ck, result);
  return result;
}

// Back-compat: Arabic-sourced translation.
export const translateAr = (text) => translateName(text, "ar");

// Save-time safety net: the live fill can miss (mid-typing request
// failed or is still in flight when mom hits save), so any name field
// still empty gets one more translation attempt on the FULL final text
// — instant when the live fill already cached it, capped at 2.5s so
// saving never feels stuck. Total failure falls back to the Arabic
// text, the pre-feature behavior.
export async function finalizeName(ar, en, fil, id = "") {
  ar = ar.trim();
  en = en.trim();
  fil = fil.trim();
  id = id.trim();
  if (ar && (!en || !fil || !id)) {
    const none = { en: "", fil: "", id: "" };
    const tr = await Promise.race([
      translateAr(ar).catch(() => none),
      new Promise((resolve) => setTimeout(() => resolve(none), 2500)),
    ]);
    en = en || tr.en;
    fil = fil || tr.fil;
    id = id || tr.id;
  }
  return { ar, en: en || ar, fil: fil || ar, id: id || ar };
}

// Debounced live translation of a name string as it's typed, FROM the
// given source language (default Arabic). Pass "" to idle.
export function useAutoTranslate(text, source = "ar") {
  const [state, setState] = useState({ en: "", fil: "", id: "", busy: false, failed: false });

  useEffect(() => {
    const key = text.trim();
    if (!key) {
      setState({ en: "", fil: "", id: "", busy: false, failed: false });
      return;
    }
    let cancelled = false;
    // Reset results, don't carry them: the text changed, so the old
    // translation is stale — and an empty→value transition guarantees
    // consumers re-apply even when the new translation is identical.
    setState({ en: "", fil: "", id: "", busy: true, failed: false });
    const timer = setTimeout(() => {
      translateName(key, source).then(({ en, fil, id }) => {
        if (!cancelled) setState({ en, fil, id, busy: false, failed: !en && !fil && !id });
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, source]);

  return state;
}
