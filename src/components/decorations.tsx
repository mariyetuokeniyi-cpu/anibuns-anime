// Cute SVG decorations: cherry blossoms, lavender hearts, fluffy clouds, sparkles

export function Blossom({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <g>
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse
            key={r}
            cx="32"
            cy="18"
            rx="9"
            ry="13"
            fill="oklch(0.88 0.10 350)"
            transform={`rotate(${r} 32 32)`}
            stroke="oklch(0.78 0.14 350)"
            strokeWidth="1"
          />
        ))}
        <circle cx="32" cy="32" r="4" fill="oklch(0.95 0.08 80)" />
        <circle cx="32" cy="32" r="1.5" fill="oklch(0.7 0.16 60)" />
      </g>
    </svg>
  );
}

export function Heart({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <path
        d="M16 27s-11-6.5-11-14a6 6 0 0 1 11-3.3A6 6 0 0 1 27 13c0 7.5-11 14-11 14z"
        fill="oklch(0.82 0.10 300)"
        stroke="oklch(0.65 0.14 300)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Cloud({ className = "", size = 100 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 120 64" width={size} height={size * 0.55} className={className} aria-hidden>
      <g fill="white" stroke="oklch(0.9 0.03 230)" strokeWidth="1.5">
        <ellipse cx="32" cy="40" rx="22" ry="16" />
        <ellipse cx="60" cy="32" rx="26" ry="20" />
        <ellipse cx="88" cy="40" rx="22" ry="16" />
      </g>
    </svg>
  );
}

export function Sparkle({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path
        d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
        fill="oklch(0.9 0.12 90)"
      />
    </svg>
  );
}

export function DecorBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-cloud-gradient" />
      <Cloud className="absolute top-10 left-4 opacity-70 animate-drift" size={140} />
      <Cloud className="absolute top-40 right-10 opacity-60 animate-float" size={110} />
      <Cloud className="absolute bottom-20 left-1/3 opacity-50 animate-drift" size={160} />
      <Blossom className="absolute top-24 right-1/4 opacity-80 animate-float" size={50} />
      <Blossom className="absolute bottom-32 right-12 opacity-70 animate-float" size={36} />
      <Heart className="absolute top-1/2 left-8 opacity-60 animate-float" size={32} />
      <Sparkle className="absolute top-32 left-1/2 animate-sparkle" size={20} />
      <Sparkle className="absolute bottom-40 right-1/3 animate-sparkle" size={14} />
    </div>
  );
}
