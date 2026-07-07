// Worker link: tasks encoded as Unicode-safe base64 in the URL hash.
// The Firebase phase replaces this with a short link (/w/ABC123).

export const encodeWorkerLink = (payload) => {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return `${window.location.origin}${window.location.pathname}#worker=${encoded}`;
};

export const decodeWorkerHash = (hash) => {
  if (!hash || !hash.startsWith("#worker=")) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(hash.slice(8)))));
  } catch {
    return null;
  }
};
