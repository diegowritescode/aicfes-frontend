/**
 * The AICFES mark.
 *
 * A shield, because the exam is a gate and the platform is what gets a
 * student through it; a rising bar chart inside, because what the
 * platform actually sells is visible progress. The institutional blue
 * is the frame, the cyan is the movement.
 */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="AICFES">
      <defs>
        <linearGradient id="aicfes-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0A6CBF" />
          <stop offset="100%" stopColor="#004884" />
        </linearGradient>
      </defs>
      <path
        d="M24 3 6 9v15c0 10.5 7.4 19.3 18 21 10.6-1.7 18-10.5 18-21V9L24 3Z"
        fill="url(#aicfes-shield)"
      />
      {/* Three bars rising: where the student starts, and where they end. */}
      <rect x="14" y="27" width="5.5" height="8" rx="1.6" fill="#2FD4E3" opacity="0.65" />
      <rect x="21.2" y="21" width="5.5" height="14" rx="1.6" fill="#2FD4E3" opacity="0.85" />
      <rect x="28.4" y="14" width="5.5" height="21" rx="1.6" fill="#B8E62E" />
    </svg>
  );
}

export function Logo({
  className = '',
  variant = 'dark',
}: {
  className?: string;
  variant?: 'dark' | 'light';
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={`text-[19px] font-extrabold tracking-tight ${
            variant === 'light' ? 'text-white' : 'text-brand'
          }`}
        >
          AICFES
        </span>
        <span
          className={`text-[10px] font-medium tracking-[0.14em] uppercase ${
            variant === 'light' ? 'text-white/60' : 'text-muted-foreground'
          }`}
        >
          Entrena tu Saber 11
        </span>
      </span>
    </span>
  );
}

export default Logo;
