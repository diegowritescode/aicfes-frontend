/**
 * The fan of thin curves behind the hero.
 *
 * Drawn as one SVG rather than as a background image: it scales to
 * any viewport without blurring, and takes its colour from the brand
 * token so a palette change reaches it.
 */
export function HeroLines({ className = '' }: { className?: string }) {
  // Curves rising from below and spreading outward, mirrored about
  // the centre so the fan stays symmetrical at every width.
  const curvas = [
    'M -10 110 C 10 70, 22 34, 26 -10',
    'M 6 112 C 22 74, 33 36, 36 -10',
    'M 22 114 C 34 78, 42 38, 44 -10',
    'M 110 110 C 90 70, 78 34, 74 -10',
    'M 94 112 C 78 74, 67 36, 64 -10',
    'M 78 114 C 66 78, 58 38, 56 -10',
  ];
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      className={`pointer-events-none ${className}`}
    >
      {curvas.map((d, i) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="hsl(var(--brand-bright))"
          strokeWidth={i % 2 === 0 ? 1.1 : 0.7}
          opacity={i % 2 === 0 ? 0.18 : 0.1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export default HeroLines;
