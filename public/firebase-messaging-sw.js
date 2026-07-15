/* Background push handler for رواق (Rawaq).
 *
 * Loaded by the browser at the site root so it can wake up and show a
 * notification even when the app (and its tab) is fully closed. It only needs
 * to initialize Firebase Messaging — the Cloud Function sends a `webpush`
 * notification payload, which firebase-messaging displays automatically here.
 *
 * The config below is the same public web config as src/firebase-config.js.
 * Keep them in sync if the Firebase project ever changes. */
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCss31fG9vYvMbWpYoKaHQRvDyGXWt9OJg",
  authDomain: "rawaq-fad4a.firebaseapp.com",
  projectId: "rawaq-fad4a",
  storageBucket: "rawaq-fad4a.firebasestorage.app",
  messagingSenderId: "1054026877681",
  appId: "1:1054026877681:web:b397f21de2e05c625ef750",
});

// Registering messaging hooks the SW's push event so notification payloads
// are shown while the app is closed. No custom handler needed — the default
// display covers our webpush.notification payload without duplicates.
firebase.messaging();

// Focus (or open) the app when the notification is tapped.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
