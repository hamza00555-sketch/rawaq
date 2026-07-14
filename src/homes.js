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

// ---- house linking: the shared "definition" that syncs across devices ----
// Photos are NOT synced (device-local, keeps the doc small). today /
// history / taskLog / lastShare are device-local too.
export const SYNC_FIELDS = ["rooms", "houseMap", "contract", "workerLang", "owner"];

const loadRaw = (id, f, fallback) => {
  try {
    const raw = localStorage.getItem(homeKey(id, f));
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

// Build the syncable definition from a home's local storage.
export function readHomeDef(id) {
  const rooms = loadRaw(id, "rooms", []);
  return {
    rooms: rooms.map((r) => ({ ...r, photo: null })),
    houseMap: loadRaw(id, "houseMap", { blocks: {} }),
    contract: loadRaw(id, "contract", null),
    workerLang: loadRaw(id, "workerLang", "fil"),
    owner: loadRaw(id, "owner", ""),
  };
}

// Write a remote definition into a home's local storage, preserving any
// local room photos by id (they never travel).
export function writeHomeDef(id, def) {
  if (Array.isArray(def.rooms)) {
    const localPhotos = {};
    for (const r of loadRaw(id, "rooms", [])) if (r.photo) localPhotos[r.id] = r.photo;
    const merged = def.rooms.map((r) => ({ ...r, photo: localPhotos[r.id] || null }));
    localStorage.setItem(homeKey(id, "rooms"), JSON.stringify(merged));
  }
  if (def.houseMap) localStorage.setItem(homeKey(id, "houseMap"), JSON.stringify(def.houseMap));
  localStorage.setItem(homeKey(id, "contract"), JSON.stringify(def.contract ?? null));
  if (def.workerLang) localStorage.setItem(homeKey(id, "workerLang"), JSON.stringify(def.workerLang));
  localStorage.setItem(homeKey(id, "owner"), JSON.stringify(def.owner ?? ""));
}
