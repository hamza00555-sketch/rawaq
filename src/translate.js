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

async function viaGoogle(text, target) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
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

async function viaMyMemory(text, target) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|${target}`;
  const res = await fetch(url, fetchOpts());
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText?.trim();
  if (!out || data?.responseStatus !== 200 || /QUERY LENGTH|INVALID/i.test(out)) {
    throw new Error("mymemory empty");
  }
  return out;
}

async function translateTo(text, target) {
  try {
    return await viaGoogle(text, target);
  } catch {
    return await viaMyMemory(text, target);
  }
}

// → {en, fil} (either may be "" on failure). Filipino = "tl" upstream.
export async function translateAr(text) {
  const key = text.trim();
  if (!key) return { en: "", fil: "" };
  const hit = cache()[key];
  if (hit) return hit;
  const [en, fil] = await Promise.allSettled([translateTo(key, "en"), translateTo(key, "tl")]).then(
    (r) => r.map((x) => (x.status === "fulfilled" ? x.value : ""))
  );
  const result = { en, fil };
  if (en && fil) remember(key, result);
  return result;
}

// Save-time safety net: the live fill can miss (mid-typing request
// failed or is still in flight when mom hits save), so any name field
// still empty gets one more translation attempt on the FULL final text
// — instant when the live fill already cached it, capped at 2.5s so
// saving never feels stuck. Total failure falls back to the Arabic
// text, the pre-feature behavior.
export async function finalizeName(ar, en, fil) {
  ar = ar.trim();
  en = en.trim();
  fil = fil.trim();
  if (ar && (!en || !fil)) {
    const tr = await Promise.race([
      translateAr(ar).catch(() => ({ en: "", fil: "" })),
      new Promise((resolve) => setTimeout(() => resolve({ en: "", fil: "" }), 2500)),
    ]);
    en = en || tr.en;
    fil = fil || tr.fil;
  }
  return { ar, en: en || ar, fil: fil || ar };
}

// Debounced live translation of an Arabic string as it's typed.
// Pass "" to idle (empty input, or edit sheets before the name changes).
export function useAutoTranslate(text) {
  const [state, setState] = useState({ en: "", fil: "", busy: false, failed: false });

  useEffect(() => {
    const key = text.trim();
    if (!key) {
      setState({ en: "", fil: "", busy: false, failed: false });
      return;
    }
    let cancelled = false;
    // Reset results, don't carry them: the text changed, so the old
    // translation is stale — and an empty→value transition guarantees
    // consumers re-apply even when the new translation is identical.
    setState({ en: "", fil: "", busy: true, failed: false });
    const timer = setTimeout(() => {
      translateAr(key).then(({ en, fil }) => {
        if (!cancelled) setState({ en, fil, busy: false, failed: !en && !fil });
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  return state;
}
