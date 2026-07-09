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

async function viaGoogle(text, target) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
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
  const res = await fetch(url);
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

// Debounced live translation of an Arabic string as it's typed.
// Pass "" to idle (empty input, or edit sheets before the name changes).
export function useAutoTranslate(text) {
  const [state, setState] = useState({ en: "", fil: "", busy: false });

  useEffect(() => {
    const key = text.trim();
    if (!key) {
      setState({ en: "", fil: "", busy: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, busy: true }));
    const timer = setTimeout(() => {
      translateAr(key).then(({ en, fil }) => {
        if (!cancelled) setState({ en, fil, busy: false });
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  return state;
}
