// Legacy long links (#worker=<base64>) are no longer generated — short
// Firestore links replaced them — but old links must keep opening.

export const decodeWorkerHash = (hash) => {
  if (!hash || !hash.startsWith("#worker=")) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(hash.slice(8)))));
  } catch {
    return null;
  }
};
