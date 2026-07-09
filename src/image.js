// Downscale + JPEG-compress a data-URL image. Used on upload (keep the
// stored photo small) and again at share time to build a tiny thumbnail
// that fits inside the Firestore share doc (1MB) alongside everything
// else. Resolves to the original on any failure — never throws.
export function compressImage(dataUrl, max = 1000, quality = 0.72) {
  return new Promise((resolve) => {
    if (typeof Image === "undefined" || !dataUrl?.startsWith("data:image")) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, max / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
