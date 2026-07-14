// Smart image shrinker: guarantees an output under a byte budget while
// keeping quality as high as that budget allows. Prefers WebP (25-35%
// smaller than JPEG at equal quality) and falls back to JPEG. Used on
// upload (keep stored photos small) and at share/upload time (tiny
// thumbnails that fit the server doc). Resolves to the original on any
// failure — never throws.

let _webp = null;
function supportsWebp() {
  if (_webp !== null) return _webp;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    _webp = c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    _webp = false;
  }
  return _webp;
}

// Approximate decoded byte size of a data URL (base64 is ~4/3 of bytes).
const approxBytes = (url) => {
  const comma = url.indexOf(",");
  return comma < 0 ? url.length : Math.floor((url.length - comma - 1) * 0.75);
};

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

function draw(img, w, h, type, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  try {
    return canvas.toDataURL(type, quality);
  } catch {
    return null;
  }
}

const fit = (img, maxDim) => {
  const s = Math.min(1, maxDim / Math.max(img.width, img.height));
  return { width: Math.max(1, Math.round(img.width * s)), height: Math.max(1, Math.round(img.height * s)) };
};

// Returns a data URL guaranteed ≤ targetBytes when achievable, else the
// smallest render it could produce. Tries the largest dimension + best
// quality first, steps quality down, then shrinks dimensions.
export async function compressImage(dataUrl, opts = {}) {
  const { maxDim = 1280, targetBytes = 140_000, minQuality = 0.5 } = opts;
  if (typeof Image === "undefined" || !dataUrl?.startsWith?.("data:image")) return dataUrl;
  const img = await loadImage(dataUrl);
  if (!img) return dataUrl;

  const type = supportsWebp() ? "image/webp" : "image/jpeg";
  let dim = maxDim;
  let best = null;
  for (let pass = 0; pass < 6 && dim >= 320; pass++) {
    const { width, height } = fit(img, dim);
    for (let q = 0.85; q >= minQuality - 0.001; q -= 0.1) {
      const out = draw(img, width, height, type, q);
      if (!out) return dataUrl;
      best = out;
      if (approxBytes(out) <= targetBytes) return out;
    }
    dim = Math.round(dim * 0.8);
  }
  return best || dataUrl;
}
