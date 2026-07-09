import Icon from "./Icons.jsx";
import { compressImage } from "../image.js";

// Native label-wrapped file input: opens the picker on every mobile browser
// without programmatic click() (which lacks activation from pointerdown).
// Photos are downscaled + JPEG-compressed so they stay small in storage.
export default function PhotoUploader({ label, onPhoto }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => compressImage(reader.result).then(onPhoto);
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
