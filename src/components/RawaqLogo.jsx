import { useId } from "react";

// Brand anchor: stays sunset-coral on every theme (self-contained gradients).
export default function RawaqLogo({ size = 64 }) {
  const uid = useId();
  const bg = `rq-bg-${uid}`;
  const shine = `rq-shine-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="شعار رواق">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF7A59" />
          <stop offset="0.55" stopColor="#E8543A" />
          <stop offset="1" stopColor="#C24E2E" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${bg})`} />
      <rect width="64" height="64" rx="18" fill={`url(#${shine})`} />
      <path
        d="M14 52 V30 a18 18 0 0 1 36 0 V52"
        fill="none"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M32 52 V38" stroke="#FFE3B0" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 42 C28 40 25 36 25 31 C30 32 32 35 32 40 Z" fill="#FFE3B0" />
      <path d="M32 40 C36 38 39 34 39 29 C34 30 32 33 32 38 Z" fill="#FFE3B0" />
    </svg>
  );
}
