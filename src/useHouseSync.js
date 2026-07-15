import { useEffect, useRef } from "react";
import { listenHouse, pushHouse } from "./house.js";
import { compressImage } from "./image.js";

// Live two-way sync for a linked home. When houseId is set, the home's
// definition — rooms (with photos), map, contract, worker language, owner —
// mirrors to Firestore: remote edits flow into local state, local edits push
// back (debounced). Room photos ride along as small compressed thumbnails,
// kept under a byte budget so the whole doc stays well within Firestore's
// 1MB limit. An echo guard on the serialized definition prevents feedback
// loops; a cheap signature drives change detection without re-compressing.

const DOC_BUDGET = 850_000; // keep the whole doc comfortably under Firestore's 1MB
const PHOTO_BUDGET = 650_000; // cap on base64 chars spent on photos per doc
const PASSTHROUGH_MAX = 80_000; // a photo already this small is sent as-is

// Non-photo fields — the def base, shared by push and apply for stable order.
const core = (s) => ({
  houseMap: s.houseMap ?? { blocks: {} },
  contract: s.contract ?? null,
  workerLang: s.workerLang ?? "fil",
  owner: s.owner ?? "",
});

// Cheap change signature: structure + a fingerprint of each photo (length +
// tail), so swapping a photo triggers a push without compressing to compare.
const changeSig = (s) =>
  JSON.stringify({
    rooms: (s.rooms || []).map((r) => ({ ...r, photo: null })),
    ...core(s),
    photos: (s.rooms || []).map((r) => (r.photo ? `${r.id}:${r.photo.length}:${r.photo.slice(-24)}` : "")),
  });

// Build the doc: rooms with thumbnail photos (compressed, cached, budgeted)
// plus the core fields. Async because compression is. A photo already small
// (e.g. a thumbnail we received) passes through so it stays byte-identical
// across devices — no re-compression tug-of-war.
async function buildDef(s, cache) {
  // Photos share the doc with room names, tasks and the map — budget them
  // against the space those leave, so a task-heavy home can't push the doc
  // over the limit.
  const baseSize = JSON.stringify({ rooms: (s.rooms || []).map((r) => ({ ...r, photo: null })), ...core(s) }).length;
  let budget = Math.max(0, Math.min(PHOTO_BUDGET, DOC_BUDGET - baseSize));
  const rooms = [];
  for (const r of s.rooms || []) {
    let photo = null;
    if (r.photo) {
      let thumb;
      if (r.photo.length <= PASSTHROUGH_MAX) {
        thumb = r.photo;
      } else if (cache.has(r.photo)) {
        thumb = cache.get(r.photo);
      } else {
        thumb = await compressImage(r.photo, { maxDim: 720, targetBytes: 45_000 }).catch(() => null);
        cache.set(r.photo, thumb);
      }
      if (thumb && thumb.length <= budget) {
        photo = thumb;
        budget -= thumb.length;
      }
    }
    rooms.push({ ...r, photo });
  }
  return { rooms, ...core(s) };
}

// Reconstruct a def from a remote doc (drops updatedAt), photos included.
const pickDef = (d) => ({
  rooms: (d.rooms || []).map((r) => ({ ...r, photo: r.photo ?? null })),
  ...core(d),
});

export function useHouseSync({
  houseId,
  rooms,
  houseMap,
  contract,
  workerLang,
  owner,
  setRooms,
  setHouseMap,
  setContract,
  setWorkerLang,
  setOwner,
}) {
  const lastSynced = useRef(null); // full def JSON last pushed OR applied (echo guard)
  const lastSig = useRef(null); // cheap change signature (push trigger)
  const local = useRef({});
  local.current = { rooms, houseMap, contract, workerLang, owner };
  const thumbs = useRef(new Map()); // source photo → thumbnail cache

  // Remote → local
  useEffect(() => {
    if (!houseId) return;
    return listenHouse(houseId, (data) => {
      const def = pickDef(data);
      const json = JSON.stringify(def);
      if (json === lastSynced.current) return; // our own echo
      lastSynced.current = json;
      const localPhoto = {};
      for (const r of local.current.rooms || []) if (r.photo) localPhoto[r.id] = r.photo;
      // remote thumbnail wins when present; otherwise keep whatever is local
      // (so a budget-dropped photo is never wiped)
      const appliedRooms = def.rooms.map((r) => ({ ...r, photo: r.photo ?? localPhoto[r.id] ?? null }));
      lastSig.current = changeSig({
        rooms: appliedRooms,
        houseMap: def.houseMap,
        contract: def.contract,
        workerLang: def.workerLang,
        owner: def.owner,
      });
      setRooms(appliedRooms);
      setHouseMap(def.houseMap);
      setContract(def.contract);
      setWorkerLang(def.workerLang);
      setOwner(def.owner);
    });
  }, [houseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Local → remote (debounced), unless nothing changed since the last sync.
  useEffect(() => {
    if (!houseId) return;
    const sig = changeSig(local.current);
    if (sig === lastSig.current) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const def = await buildDef(local.current, thumbs.current);
      if (cancelled) return;
      lastSig.current = sig;
      lastSynced.current = JSON.stringify(def);
      pushHouse(houseId, def).catch(() => {});
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [houseId, rooms, houseMap, contract, workerLang, owner]);
}
