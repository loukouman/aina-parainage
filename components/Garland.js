const COLORS = ['#D7263D', '#F4C257', '#2E9E5B', '#FFF3D6'];
const SPOTS = [[15, 14], [45, 24], [75, 24], [105, 14]];

function Segment({ n }) {
  return (
    <svg width="120" height="52" viewBox="0 0 120 52" className="shrink-0" aria-hidden="true">
      <path d="M0 6 Q60 44 120 6" fill="none" stroke="#3C8F66" strokeWidth="2.5" />
      {SPOTS.map(([x, y], i) => (
        <g key={i} className="bulb" style={{ animationDelay: `${((n * 4 + i) % 7) * 0.35}s` }}>
          <rect x={x - 2.5} y={y - 1} width="5" height="5" rx="1" fill="#C9A227" />
          <ellipse cx={x} cy={y + 8} rx="5" ry="7" fill={COLORS[(n + i) % 4]} />
          <ellipse cx={x - 1.5} cy={y + 6} rx="1.4" ry="2.2" fill="#fff" opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

// Guirlande lumineuse décorative (ignorée par les lecteurs d'écran).
export default function Garland({ count = 22, className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none flex overflow-hidden ${className}`}>
      {Array.from({ length: count }, (_, i) => <Segment key={i} n={i} />)}
    </div>
  );
}
