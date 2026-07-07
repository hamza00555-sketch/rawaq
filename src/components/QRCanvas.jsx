import { useEffect, useRef } from "react";

// Decorative pseudo-QR drawn on canvas from a hash of the link (no external
// library — the real scannable QR arrives with the Firebase short-link phase).
export default function QRCanvas({ value, size = 180 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cells = 25;
    const cell = size / cells;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#1F2A26";

    // deterministic bits from the string
    let h = 2166136261;
    const bit = (i) => {
      h ^= value.charCodeAt(i % value.length) + i;
      h = Math.imul(h, 16777619);
      return (h >>> 13) % 3 !== 0;
    };

    let i = 0;
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const inFinder =
          (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
        if (!inFinder && bit(i++)) ctx.fillRect(x * cell, y * cell, cell - 0.5, cell - 0.5);
      }
    }

    // finder squares
    const finder = (fx, fy) => {
      ctx.fillRect(fx * cell, fy * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect((fx + 1) * cell, (fy + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = "#1F2A26";
      ctx.fillRect((fx + 2) * cell, (fy + 2) * cell, 3 * cell, 3 * cell);
    };
    finder(0, 0);
    finder(cells - 7, 0);
    finder(0, cells - 7);
  }, [value, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ borderRadius: 12 }}
      aria-hidden="true"
    />
  );
}
