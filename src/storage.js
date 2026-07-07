import { useEffect, useState } from "react";

// All persistence flows through this module. The Firebase phase swaps the
// internals here (localStorage → Firestore) without touching screens.

export const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full (e.g. large base64 photos) — keep the app running
  }
};

export function useStoredState(key, fallback) {
  const [state, setState] = useState(() => load(key, fallback));
  useEffect(() => {
    save(key, state);
  }, [key, state]);
  return [state, setState];
}
