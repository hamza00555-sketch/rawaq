import { useEffect, useRef } from "react";
import { listenHouse, pushHouse } from "./house.js";

// Live two-way sync for a linked home. When houseId is set, the home's
// definition (rooms sans photos, map, contract, worker language, owner)
// mirrors to Firestore: remote edits flow into local state, local edits
// push back (debounced). An echo guard on the serialized definition
// prevents feedback loops. Photos are preserved locally on apply.
const defOf = (s) => ({
  rooms: (s.rooms || []).map((r) => ({ ...r, photo: null })),
  houseMap: s.houseMap ?? { blocks: {} },
  contract: s.contract ?? null,
  workerLang: s.workerLang ?? "fil",
  owner: s.owner ?? "",
});

const pickDef = (d) => defOf(d); // remote docs carry extra updatedAt — ignore

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
  const lastSynced = useRef(null); // JSON of the last def pushed OR applied
  const local = useRef({});
  local.current = { rooms, houseMap, contract, workerLang, owner };

  // Remote → local
  useEffect(() => {
    if (!houseId) return;
    return listenHouse(houseId, (data) => {
      const def = pickDef(data);
      const json = JSON.stringify(def);
      if (json === lastSynced.current) return; // our own echo
      lastSynced.current = json;
      const photoById = {};
      for (const r of local.current.rooms || []) if (r.photo) photoById[r.id] = r.photo;
      setRooms(def.rooms.map((r) => ({ ...r, photo: photoById[r.id] || null })));
      setHouseMap(def.houseMap);
      setContract(def.contract);
      setWorkerLang(def.workerLang);
      setOwner(def.owner);
    });
  }, [houseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Local → remote (debounced), unless it equals what we last synced.
  useEffect(() => {
    if (!houseId) return;
    const def = defOf(local.current);
    const json = JSON.stringify(def);
    if (json === lastSynced.current) return;
    const timer = setTimeout(() => {
      lastSynced.current = json;
      pushHouse(houseId, def).catch(() => {});
    }, 700);
    return () => clearTimeout(timer);
  }, [houseId, rooms, houseMap, contract, workerLang, owner]);
}
