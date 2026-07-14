import { STORAGE_KEYS } from "./data.js";

// Move a household to another phone: pack the home data into one opaque,
// copy-pasteable code (base64 of JSON) that survives WhatsApp/Notes.
// Photos are intentionally dropped — they're large and would push the
// code past messaging size limits; everything else (map, rooms, tasks,
// contract, worker language, completion log, preferences) travels.
const PREFIX = "RAWAQ-HOME-1:";
const KEYS = ["rooms", "houseMap", "owner", "contract", "workerLang", "taskLog", "lang", "theme", "uiSize"];

// Unicode-safe base64 (btoa only handles Latin1).
const b64encode = (str) => btoa(unescape(encodeURIComponent(str)));
const b64decode = (str) => decodeURIComponent(escape(atob(str)));

export function exportHome() {
  const keys = {};
  for (const k of KEYS) {
    const raw = localStorage.getItem(STORAGE_KEYS[k]);
    if (raw != null) keys[k] = raw; // keep the stored JSON strings verbatim
  }
  if (keys.rooms) {
    try {
      keys.rooms = JSON.stringify(JSON.parse(keys.rooms).map((r) => ({ ...r, photo: null })));
    } catch {
      // leave rooms as-is if it can't be parsed
    }
  }
  return PREFIX + b64encode(JSON.stringify({ v: 1, keys }));
}

// Parse + validate a code → the { key: rawJson } map. Throws "format"
// (not a Rawaq code) or "decode" (corrupted) so the caller can message.
export function parseHome(code) {
  const trimmed = (code || "").trim();
  if (!trimmed.startsWith(PREFIX)) throw new Error("format");
  let obj;
  try {
    obj = JSON.parse(b64decode(trimmed.slice(PREFIX.length)));
  } catch {
    throw new Error("decode");
  }
  if (!obj || obj.v !== 1 || typeof obj.keys !== "object" || !obj.keys.rooms) throw new Error("format");
  return obj.keys;
}

// Overwrite local storage with an imported set, then the caller reloads.
export function applyHome(keys) {
  for (const [k, raw] of Object.entries(keys)) {
    if (STORAGE_KEYS[k] && typeof raw === "string") localStorage.setItem(STORAGE_KEYS[k], raw);
  }
  // today's list is derived from rooms + log — clear it so it rebuilds fresh
  localStorage.removeItem(STORAGE_KEYS.today);
  localStorage.removeItem(STORAGE_KEYS.lastShare);
}
