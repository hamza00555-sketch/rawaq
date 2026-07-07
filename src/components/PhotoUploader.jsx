import { useRef } from "react";
import { press } from "../press.js";

export default function PhotoUploader({ label, onPhoto }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPhoto(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      <button type="button" className="btn btn-soft btn-block" {...press(() => inputRef.current?.click())}>
        📷 {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  );
}
