import { STORAGE_KEYS } from "./data.js";

// Multiple households on one device. Each home's data lives under its own
// namespaced keys (rawaq_h_<id>_<field>); a small global registry tracks
// the list of homes and which one is active. Switching a home remounts
// the app so every per-home hook re-reads the new namespace.

export const HOMES_KEY = "rawaq_homes";
export const ACTIVE_KEY = "rawaq_active_home";
export const ONBOARDED_KEY = "rawaq_onboarded";

// Per-home fields (mirror the flat STORAGE_KEYS that used to be global).
export const HOME_FIELDS = [
  "rooms",
  "houseMap",
  "today",
  "history",
  "taskLog",
  "contract",
  "workerLang",
  "lastShare",
  "owner",
];

export const homeKey = (id, field) => `rawaq_h_${id}_${field}`;
export const newHomeId = () => `h${Date.now().toString(36)}`;

export function readActiveHome() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_KEY)) || "default";
  } catch {
    return "default";
  }
}

// One-time migration: the app used flat global keys for a single home.
// Move them into the "default" home namespace and seed the registry.
// Runs at boot (main.jsx) before React mounts. Returning users (who had
// data) skip onboarding.
export function ensureHomes() {
  if (localStorage.getItem(HOMES_KEY)) return;
  const id = "default";
  let hadData = false;
  for (const f of HOME_FIELDS) {
    const flat = STORAGE_KEYS[f];
    const raw = flat ? localStorage.getItem(flat) : null;
    if (raw != null) {
      hadData = true;
      localStorage.setItem(homeKey(id, f), raw);
      localStorage.removeItem(flat);
    }
  }
  localStorage.setItem(HOMES_KEY, JSON.stringify([{ id, name: "بيتي" }]));
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(id));
  if (hadData) localStorage.setItem(ONBOARDED_KEY, "1");
}

// Delete every stored key for a home (used when removing it).
export function removeHomeData(id) {
  for (const f of HOME_FIELDS) localStorage.removeItem(homeKey(id, f));
}
