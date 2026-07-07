// Firebase web config — public by design; security lives in Firestore rules.
// Paste the real values from Firebase console → Project settings → Your apps.
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
};

export const isFirebaseConfigured = () => !/^PASTE_/.test(firebaseConfig.apiKey);
