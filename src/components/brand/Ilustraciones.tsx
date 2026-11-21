/**
 * One illustration per exam area, drawn as SVG.
 *
 * Vector rather than generated images: each is under 2 KB, stays
 * sharp on any screen, and takes the palette's colours directly so a
 * change to the brand reaches all five at once.
 *
 * Every shape is geometric and built from the area's own subject —
 * the maths one is a real right triangle, the science one a real
 * flask — so they read as what they label rather than as decoration.
 */

interface Props {
  className?: string;
}

const base = 'h-full w-full';

export function IlustracionMatematicas({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 160 120" className={`${base} ${className}`} role="img" aria-label="Matemáticas">
      <defs>
        <linearGradient id="il-mat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6D4AFF" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      <circle cx="128" cy="30" r="22" fill="#FF3D8B" opacity="0.18" />
      <polygon points="28,96 108,96 28,34" fill="url(#il-mat)" opacity="0.9" />
      {/* The right-angle mark: the figure is a real triangle. */}
      <path d="M28 82 L42 82 L42 96" fill="none" stroke="#0B1033" strokeWidth="2.5" />
      <circle cx="108" cy="96" r="5" fill="#B8FF3D" />
      <circle cx="28" cy="34" r="5" fill="#FFB020" />
    </svg>
  );
}

export function IlustracionLectura({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 160 120" className={`${base} ${className}`} role="img" aria-label="Lectura Crítica">
      <defs>
        <linearGradient id="il-lc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF3D8B" />
          <stop offset="100%" stopColor="#6D4AFF" />
        </linearGradient>
      </defs>
      <rect x="22" y="22" width="78" height="92" rx="7" fill="url(#il-lc)" opacity="0.9" />
      <rect x="36" y="40" width="50" height="5" rx="2.5" fill="#ffffff" opacity="0.85" />
      <rect x="36" y="54" width="42" height="5" rx="2.5" fill="#ffffff" opacity="0.6" />
      <rect x="36" y="68" width="50" height="5" rx="2.5" fill="#ffffff" opacity="0.6" />
      <rect x="36" y="82" width="30" height="5" rx="2.5" fill="#ffffff" opacity="0.4" />
      {/* A magnifier: the area is about reading closely, not reading. */}
      <circle cx="112" cy="66" r="24" fill="none" stroke="#00D4FF" strokeWidth="5" />
      <line x1="130" y1="84" x2="146" y2="100" stroke="#00D4FF" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function IlustracionCiencias({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 160 120" className={`${base} ${className}`} role="img" aria-label="Ciencias Naturales">
      <defs>
        <linearGradient id="il-cn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#B8FF3D" />
        </linearGradient>
      </defs>
      <path
        d="M66 20 L66 50 L40 100 Q36 110 48 110 L112 110 Q124 110 120 100 L94 50 L94 20 Z"
        fill="none" stroke="#6D4AFF" strokeWidth="4" strokeLinejoin="round"
      />
      <path d="M52 78 L108 78 L120 100 Q124 110 112 110 L48 110 Q36 110 40 100 Z" fill="url(#il-cn)" opacity="0.85" />
      <circle cx="72" cy="92" r="4" fill="#ffffff" opacity="0.7" />
      <circle cx="90" cy="98" r="3" fill="#ffffff" opacity="0.5" />
      <rect x="62" y="14" width="36" height="7" rx="3.5" fill="#FF3D8B" />
    </svg>
  );
}

export function IlustracionSociales({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 160 120" className={`${base} ${className}`} role="img" aria-label="Sociales y Ciudadanas">
      <defs>
        <linearGradient id="il-soc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB020" />
          <stop offset="100%" stopColor="#FF3D8B" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="62" r="42" fill="url(#il-soc)" opacity="0.9" />
      {/* Meridians, so the circle reads as a globe. */}
      <ellipse cx="80" cy="62" rx="18" ry="42" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.55" />
      <line x1="38" y1="62" x2="122" y2="62" stroke="#ffffff" strokeWidth="2.5" opacity="0.55" />
      <path d="M44 42 Q80 54 116 42" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.4" />
      <path d="M44 82 Q80 70 116 82" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.4" />
      <circle cx="122" cy="26" r="9" fill="#00D4FF" />
      <circle cx="34" cy="98" r="6" fill="#B8FF3D" />
    </svg>
  );
}

export function IlustracionIngles({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 160 120" className={`${base} ${className}`} role="img" aria-label="Inglés">
      <defs>
        <linearGradient id="il-ing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6D4AFF" />
          <stop offset="100%" stopColor="#FF3D8B" />
        </linearGradient>
      </defs>
      <path d="M20 24 H104 Q112 24 112 32 V74 Q112 82 104 82 H48 L28 100 V82 H20 Q12 82 12 74 V32 Q12 24 20 24 Z"
        fill="url(#il-ing)" opacity="0.9" />
      <text x="62" y="60" fontSize="30" fontWeight="700" fill="#ffffff" textAnchor="middle"
        fontFamily="system-ui, sans-serif">A</text>
      <path d="M108 44 H142 Q150 44 150 52 V86 Q150 94 142 94 H134 V110 L118 94 H108 Q100 94 100 86 V52 Q100 44 108 44 Z"
        fill="#00D4FF" opacity="0.92" />
      <text x="125" y="78" fontSize="26" fontWeight="700" fill="#0B1033" textAnchor="middle"
        fontFamily="system-ui, sans-serif">文</text>
    </svg>
  );
}

export const ILUSTRACIONES = {
  MAT: IlustracionMatematicas,
  LC: IlustracionLectura,
  CN: IlustracionCiencias,
  SOC: IlustracionSociales,
  ING: IlustracionIngles,
} as const;
