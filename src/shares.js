// Short worker links: tasks stored in Firestore, link carries only #w=<id>.
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

// In-memory Firestore handle, created on first use so placeholder config
// can never break app boot.
let dbPromise = null;
const getDb = () => {
  if (!dbPromise) {
    dbPromise = Promise.all([import("firebase/app"), import("firebase/firestore/lite")]).then(
      ([{ initializeApp }, firestore]) => ({
        db: firestore.getFirestore(initializeApp(firebaseConfig)),
        firestore,
      })
    );
  }
  return dbPromise;
};

// DEV-only fake store so share flows are testable without network access.
// Never active in production builds: there we fall back to the long link.
const devStore = {
  enabled: () => import.meta.env.DEV && !isFirebaseConfigured(),
  read: () => JSON.parse(localStorage.getItem("rawaq_dev_shares") || "{}"),
  set(id, data) {
    const all = this.read();
    all[id] = data;
    localStorage.setItem("rawaq_dev_shares", JSON.stringify(all));
  },
  get(id) {
    return this.read()[id] ?? null;
  },
};

const shareLink = (id) => `${window.location.origin}${window.location.pathname}#w=${id}`;

export async function createShare({ tasks, date, mode, owner }) {
  const data = { tasks, date, mode, owner: owner || "", createdAt: Date.now() };

  if (devStore.enabled()) {
    const id = makeShortId();
    devStore.set(id, data);
    return shareLink(id);
  }

  if (!isFirebaseConfigured()) throw new Error("firebase-not-configured");

  const { db, firestore } = await getDb();
  // Rules forbid update, so an id collision fails as permission-denied —
  // one retry with a fresh id covers it.
  for (let attempt = 0; attempt < 2; attempt++) {
    const id = makeShortId();
    try {
      await firestore.setDoc(firestore.doc(db, "shares", id), data);
      return shareLink(id);
    } catch (err) {
      if (attempt === 1) throw err;
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
