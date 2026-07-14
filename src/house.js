// House linking: a home's definition (rooms, map, contract, worker
// language, owner) lives in Firestore under houses/{code}. Devices that
// hold the code sync it live — build "بيت خالتي" on your phone and she
// sees it on hers, each device naming its copy locally. Photos are NOT
// synced (device-local, keeps the doc small). Reuses the shares Firebase
// plumbing and a dev store for offline/testing.
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { makeShortId } from "./shares.js";

export const newHouseCode = makeShortId;

let dbPromise = null;
const getDb = () => {
  if (!dbPromise) {
    dbPromise = Promise.all([import("firebase/app"), import("firebase/firestore")]).then(
      ([{ initializeApp }, firestore]) => ({
        db: firestore.getFirestore(initializeApp(firebaseConfig)),
        firestore,
      })
    );
  }
  return dbPromise;
};

const devStore = {
  enabled: () =>
    import.meta.env.VITE_FORCE_DEV_STORE === "1" ||
    (import.meta.env.DEV && !isFirebaseConfigured()),
  read: () => JSON.parse(localStorage.getItem("rawaq_dev_houses") || "{}"),
  set(id, data) {
    const all = this.read();
    all[id] = data;
    localStorage.setItem("rawaq_dev_houses", JSON.stringify(all));
  },
  get(id) {
    return this.read()[id] ?? null;
  },
  listen(id, cb) {
    let last = JSON.stringify(this.get(id));
    const emit = () => {
      const doc = this.get(id);
      const raw = JSON.stringify(doc);
      if (raw !== last) {
        last = raw;
        if (doc) cb(doc);
      }
    };
    const onStorage = (e) => {
      if (e.key === "rawaq_dev_houses") emit();
    };
    window.addEventListener("storage", onStorage);
    const timer = setInterval(emit, 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  },
};

// Upload the current home definition. Throws a coded error on failure so
// the UI can distinguish "update your Firebase rules" from a network drop.
export async function pushHouse(code, data) {
  const payload = { ...data, updatedAt: Date.now() };
  if (devStore.enabled()) {
    devStore.set(code, payload);
    return;
  }
  if (!isFirebaseConfigured()) throw coded("network");
  try {
    const { db, firestore } = await getDb();
    await firestore.setDoc(firestore.doc(db, "houses", code), payload);
  } catch (err) {
    throw coded(err?.code === "permission-denied" ? "rules" : "network");
  }
}

export async function fetchHouse(code) {
  if (devStore.enabled()) return devStore.get(code);
  if (!isFirebaseConfigured()) return null;
  try {
    const { db, firestore } = await getDb();
    const snap = await firestore.getDoc(firestore.doc(db, "houses", code));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    throw coded(err?.code === "permission-denied" ? "rules" : "network");
  }
}

// cb(data) on every remote change. Returns an unsubscribe function.
export function listenHouse(code, cb) {
  if (devStore.enabled()) return devStore.listen(code, cb);
  if (!isFirebaseConfigured()) return () => {};
  let unsub = null;
  let cancelled = false;
  getDb().then(({ db, firestore }) => {
    if (cancelled) return;
    unsub = firestore.onSnapshot(firestore.doc(db, "houses", code), (snap) => {
      if (snap.metadata.hasPendingWrites) return; // skip our own writes
      if (snap.exists()) cb(snap.data());
    });
  });
  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

function coded(kind) {
  const e = new Error("house-" + kind);
  e.code = kind;
  return e;
}
