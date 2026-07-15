// Firebase web config — public by design; security lives in Firestore rules.
// Paste the real values from Firebase console → Project settings → Your apps.
export const firebaseConfig = {
  apiKey: "AIzaSyCss31fG9vYvMbWpYoKaHQRvDyGXWt9OJg",
  authDomain: "rawaq-fad4a.firebaseapp.com",
  projectId: "rawaq-fad4a",
  storageBucket: "rawaq-fad4a.firebasestorage.app",
  messagingSenderId: "1054026877681",
  appId: "1:1054026877681:web:b397f21de2e05c625ef750",
};

export const isFirebaseConfigured = () => !/^PASTE_/.test(firebaseConfig.apiKey);

// Web Push (VAPID) public key for closed-app notifications via FCM.
// Firebase console → Project settings → Cloud Messaging → Web Push
// certificates → "Key pair". Paste the public key here. Until it's set,
// push stays off and only in-app (foreground) notifications fire.
export const vapidKey = "PASTE_VAPID_KEY";

export const isPushConfigured = () =>
  isFirebaseConfigured() && !!vapidKey && !/^PASTE_/.test(vapidKey);
