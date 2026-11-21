import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { HeroScene } from './HeroScene';
import { HeroLines } from './HeroLines';

/**
 * The frame both auth pages share.
 *
 * Form on the left on a white field; on wide screens a panel on the
 * right carrying the same orb and curves as the landing, so signing
 * in does not look like a different product.
 *
 * Signing up is where people abandon, so the panel keeps answering
 * the question they are actually asking — whether this is worth two
 * minutes — rather than decorating the page.
 */
export function AuthFrame({
  badge,
  title,
  subtitle,
  children,
  footer,
  panelTitle,
  panelPoints,
}: {
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  panelTitle: string;
  panelPoints: readonly string[];
}) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_0.9fr]">
      {/* The form. */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link to="/" aria-label="AICFES, inicio" className="mb-auto inline-flex">
          <Logo />
        </Link>

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-sm py-12"
        >
          <p className="mb-3 inline-block rounded-full bg-brand-soft/60 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-brand-bright uppercase">
            {badge}
          </p>
          <h1 className="text-[1.95rem] leading-tight font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-slate-600">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </motion.main>

        <div className="mx-auto w-full max-w-sm text-[13.5px] text-slate-600">{footer}</div>
      </div>

      {/* The panel: hidden on a phone, where the form is the page. */}
      <aside className="hero-wash relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center">
        <HeroLines className="absolute inset-0 h-full w-full" />

        <div className="relative px-12">
          <div className="mx-auto mb-8 h-[150px] w-[150px]">
            <HeroScene className="h-full w-full" />
          </div>

          <h2 className="mx-auto max-w-sm text-center text-[1.55rem] leading-tight font-extrabold tracking-tight text-slate-900">
            {panelTitle}
          </h2>
          <ul className="mx-auto mt-7 max-w-xs space-y-3.5">
            {panelPoints.map((point, i) => (
              <motion.li
                key={point}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.25 + i * 0.09 }}
                className="flex items-start gap-2.5 text-[14px] text-slate-700"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-bright text-[11px] font-bold text-white"
                >
                  ✓
                </span>
                {point}
              </motion.li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default AuthFrame;
