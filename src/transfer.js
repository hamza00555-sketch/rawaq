import { STORAGE_KEYS } from "./data.js";

// Move a household to another phone: pack the home data into one opaque,
// copy-pasteable code that survives WhatsApp/Notes. The JSON is deflated
// (CompressionStream) before base64 so the code is short — a full house
// is a few hundred characters. Photos are dropped: they're large and
// would bloat the code past messaging limits; everything else (map,
// rooms, tasks, contract, worker language, log, preferences) travels.
const CPREFIX = "RQ1:"; // compressed
const PREFIX = "RAWAQ-HOME-1:"; // legacy plain base64 (still importable)
const KEYS = ["rooms", "houseMap", "owner", "contract", "workerLang", "taskLog", "lang", "theme", "uiSize"];

// Unicode-safe base64 for the plain fallback path.
const b64encode = (str) => btoa(unescape(encodeURIComponent(str)));
const b64decode = (str) => decodeURIComponent(escape(atob(str)));

// Byte <-> base64 (for the compressed binary path).
function bytesToB64(bytes) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}
function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deflate(str) {
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const buf = await new Response(stream).arrayBuffer();
  return bytesToB64(new Uint8Array(buf));
}
async function inflate(b64) {
  const stream = new Blob([b64ToBytes(b64)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return await new Response(stream).text();
}

function buildJson() {
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
  return JSON.stringify({ v: 1, keys });
}

export async function exportHome() {
  const json = buildJson();
  if (typeof CompressionStream !== "undefined") {
    try {
      return CPREFIX + (await deflate(json));
    } catch {
      // fall through to plain
    }
  }
  return PREFIX + b64encode(json);
}

// Parse + validate a code → the { key: rawJson } map. Throws "format"
// (not a Rawaq code) or "decode" (corrupted) so the caller can message.
export async function parseHome(code) {
  const trimmed = (code || "").trim();
  let json;
  if (trimmed.startsWith(CPREFIX)) {
    try {
      json = await inflate(trimmed.slice(CPREFIX.length));
    } catch {
      throw new Error("decode");
    }
  } else if (trimmed.startsWith(PREFIX)) {
    try {
      json = b64decode(trimmed.slice(PREFIX.length));
    } catch {
      throw new Error("decode");
    }
  } else {
    throw new Error("format");
  }
  let obj;
  try {
    obj = JSON.parse(json);
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
