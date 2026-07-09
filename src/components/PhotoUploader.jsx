import Icon from "./Icons.jsx";

// Downscale + JPEG-compress so a room photo is small enough to sit in
// localStorage AND ride inside the Firestore share doc (1MB limit) to
// the worker. Falls back to the raw data URL if canvas isn't available.
const compress = (dataUrl, max = 1000, quality = 0.72) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, max / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
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

// Native label-wrapped file input: opens the picker on every mobile browser
// without programmatic click() (which lacks activation from pointerdown).
export default function PhotoUploader({ label, onPhoto }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => compress(reader.result).then(onPhoto);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <label className="btn btn-soft btn-block photo-label">
      <Icon name="camera" size={20} /> {label}
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />
    </label>
  );
}
