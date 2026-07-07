// Native label-wrapped file input: opens the picker on every mobile browser
// without programmatic click() (which lacks activation from pointerdown).
export default function PhotoUploader({ label, onPhoto }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPhoto(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <label className="btn btn-soft btn-block photo-label">
      📷 {label}
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />
    </label>
  );
}
