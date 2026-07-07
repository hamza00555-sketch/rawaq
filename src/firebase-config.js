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
