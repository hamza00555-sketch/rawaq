export default function ProgressRing({ percent, size = 170, label, celebrate, compact = false }) {
  const stroke = compact ? 9 : 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);

  return (
    <div className={celebrate ? "ring-celebrate" : ""} style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label ?? ""} ${percent}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-pct" style={compact ? { fontSize: Math.round(size * 0.26) } : undefined}>{percent}%</span>
        {label && <span className="muted">{label}</span>}
      </div>
    </div>
  );
}
