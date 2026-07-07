import { useEffect, useRef } from "react";
import QRCode from "qrcode";

// Real scannable QR rendered to canvas.
export default function QRCanvas({ value, size = 180, label }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#1F2A26", light: "#FFFFFF" },
    }).catch(() => {});
  }, [value, size]);

  return <canvas ref={ref} style={{ borderRadius: 12 }} role="img" aria-label={label || "QR"} />;
}
