// Closed-app push (FCM Web Push). Mom's device registers a service worker and
// fetches an FCM token, then saves it — plus the pre-localized strings the
// notification should use — to pushTokens/{shareId}. A Cloud Function reads
// that doc when the worker completes a task and sends the push, so mom is
// alerted even when the app is fully closed.
//
// Everything here degrades gracefully: if push isn't configured (no VAPID key
// yet) or the browser can't do web push, every call is a silent no-op and the
// app behaves exactly as before (foreground-only notifications).
import { firebaseConfig, isPushConfigured, vapidKey } from "./firebase-config.js";

let appPromise = null;
const getApp = () => {
  if (!appPromise) {
    appPromise = import("firebase/app").then(({ initializeApp, getApps }) =>
      getApps()[0] || initializeApp(firebaseConfig)
    );
  }
  return appPromise;
};

export async function pushSupported() {
  if (!isPushConfigured()) return false;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    const { isSupported } = await import("firebase/messaging");
    return await isSupported();
  } catch {
    return false;
  }
}

// Register the SW and fetch this device's FCM token. Returns null on any
// failure or when permission hasn't been granted.
export async function getPushToken() {
  if (!(await pushSupported())) return null;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return null;
  try {
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const app = await getApp();
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(app);
    return await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
  } catch {
    return null;
  }
}

// Save mom's token + the strings the Cloud Function should send. The function
// stays language-agnostic: it just picks bodyOne/bodyMany and fills {n}.
export async function savePushToken(shareId, { token, title, bodyOne, bodyMany }) {
  if (!shareId || !token) return;
  try {
    const app = await getApp();
    const { getFirestore, doc, setDoc } = await import("firebase/firestore");
    const db = getFirestore(app);
    await setDoc(doc(db, "pushTokens", shareId), {
      token,
      title,
      bodyOne,
      bodyMany,
      updatedAt: Date.now(),
    });
  } catch {
    // best-effort — foreground notifications still cover the app-open case
  }
}
