// Device notifications. These fire while the app is running (foreground or a
// live background tab) via the Web Notifications API — enough to ping mom when
// the worker updates tasks. True lock-screen push when the app is fully closed
// would need a service worker + a push service (FCM); not set up here.

export const notifySupported = () => typeof Notification !== "undefined";

export const notifyPermission = () => (notifySupported() ? Notification.permission : "denied");

export async function requestNotify() {
  if (!notifySupported()) return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

// Show a notification if the user opted in and granted permission. No-op
// otherwise, and never throws.
export function notify(title, body) {
  if (!notifySupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon-192.png", tag: "rawaq-tasks", renotify: true });
  } catch {
    // some browsers require a service worker for Notification — ignore
  }
}
