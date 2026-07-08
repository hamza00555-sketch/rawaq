// Short worker links: tasks stored in Firestore, link carries only #w=<id>.
// Uses the full firestore SDK (lazy-loaded) for realtime worker→mom sync.
// Falls back to the legacy long #worker= hash when Firebase is unavailable.
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export const makeShortId = () => {
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
};

export const parseShortHash = (hash) => {
  const m = /^#w=([a-z0-9]{6,8})$/.exec(hash || "");
  return m ? m[1] : null;
};

export const shareIdFromLink = (link) => parseShortHash(link.slice(link.indexOf("#")));

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

// DEV/test fake store so share flows (including live sync) run without
// network. Active in dev builds when config is placeholder, or when forced
// via VITE_FORCE_DEV_STORE for local verification against real config.
const devStore = {
  enabled: () =>
    import.meta.env.VITE_FORCE_DEV_STORE === "1" ||
    (import.meta.env.DEV && !isFirebaseConfigured()),
  read: () => JSON.parse(localStorage.getItem("rawaq_dev_shares") || "{}"),
  set(id, data) {
    const all = this.read();
    all[id] = data;
    localStorage.setItem("rawaq_dev_shares", JSON.stringify(all));
  },
  get(id) {
    return this.read()[id] ?? null;
  },
  update(id, patch) {
    const doc = this.get(id);
    if (doc) this.set(id, { ...doc, ...patch });
  },
  // storage events cover cross-page sync (they never fire in the writing
  // tab — no self-echo); a light poll covers same-tab updates.
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
      if (e.key === "rawaq_dev_shares") emit();
    };
    window.addEventListener("storage", onStorage);
    const timer = setInterval(emit, 1200);
    const first = this.get(id);
    if (first) cb(first);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  },
};

const shareLink = (id) => `${window.location.origin}${window.location.pathname}#w=${id}`;

export async function createShare({ tasks, date, owner, rooms }) {
  const data = {
    tasks,
    date,
    owner: owner || "",
    rooms: rooms || {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  // Compatible with the ORIGINAL security rules (require `mode`, reject
  // rooms/updatedAt). If the user hasn't published the updated rules yet,
  // sharing still works — just without room grouping and live sync.
  const legacyData = {
    tasks,
    date,
    mode: "surface",
    owner: owner || "",
    createdAt: Date.now(),
  };

  if (devStore.enabled()) {
    const id = makeShortId();
    devStore.set(id, data);
    return shareLink(id);
  }

  if (!isFirebaseConfigured()) throw new Error("firebase-not-configured");

  const { db, firestore } = await getDb();
  const write = async (payload) => {
    // Rules confine updates to tasks/updatedAt, so a colliding setDoc (which
    // would change createdAt) fails permission-denied — one retry covers it.
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      const id = makeShortId();
      try {
        await firestore.setDoc(firestore.doc(db, "shares", id), payload);
        return shareLink(id);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  };

  try {
    return await write(data);
  } catch (err) {
    if (err?.code !== "permission-denied") throw err;
    try {
      return await write(legacyData);
    } catch (err2) {
      const wrapped = new Error("share-rules-outdated");
      wrapped.code = err2?.code === "permission-denied" ? "rules" : "network";
      throw wrapped;
    }
  }
}

export async function fetchShare(id) {
  if (devStore.enabled()) return devStore.get(id);
  if (!isFirebaseConfigured()) return null;
  const { db, firestore } = await getDb();
  const snap = await firestore.getDoc(firestore.doc(db, "shares", id));
  return snap.exists() ? snap.data() : null;
}

// Worker side: persist her checkmarks so mom sees them live.
export async function updateShareTasks(id, tasks) {
  if (devStore.enabled()) {
    devStore.update(id, { tasks, updatedAt: Date.now() });
    return;
  }
  if (!isFirebaseConfigured()) return;
  const { db, firestore } = await getDb();
  await firestore.updateDoc(firestore.doc(db, "shares", id), {
    tasks,
    updatedAt: Date.now(),
  });
}

// Returns an unsubscribe function. cb(data) fires with the current doc
// immediately, then on every remote change (own pending writes skipped).
export function listenShare(id, cb) {
  if (devStore.enabled()) return devStore.listen(id, cb);
  if (!isFirebaseConfigured()) return () => {};
  let unsub = null;
  let cancelled = false;
  getDb().then(({ db, firestore }) => {
    if (cancelled) return;
    unsub = firestore.onSnapshot(firestore.doc(db, "shares", id), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) cb(snap.data());
    });
  });
  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}
