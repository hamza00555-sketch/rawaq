export default function RawaqLogo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="شعار رواق">
      <rect width="64" height="64" rx="16" fill="var(--primary)" />
      <path
        d="M14 52 V30 a18 18 0 0 1 36 0 V52"
        fill="none"
        stroke="var(--on-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M32 52 V38" stroke="var(--primary-soft)" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 42 C28 40 25 36 25 31 C30 32 32 35 32 40 Z" fill="var(--primary-soft)" />
      <path d="M32 40 C36 38 39 34 39 29 C34 30 32 33 32 38 Z" fill="var(--primary-soft)" />
    </svg>
  );
}
