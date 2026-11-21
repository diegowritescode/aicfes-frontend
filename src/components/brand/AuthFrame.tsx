import { Link } from 'react-router-dom';
import { Logo } from './Logo';

/**
 * The frame both auth pages share: the form on the left, and on wide
 * screens a panel that keeps selling while the student types.
 *
 * Signing in is where people abandon, so the panel answers the question
 * they are actually asking — is this worth the two minutes — rather
 * than decorating the page.
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
    <div className="grid min-h-screen lg:grid-cols-[1fr_0.85fr]">
      {/* The form. */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link to="/" aria-label="AICFES, inicio" className="mb-auto inline-flex">
          <Logo />
        </Link>

        <main className="mx-auto w-full max-w-sm py-12">
          <p className="mb-3 inline-block rounded-full bg-brand/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-brand uppercase">
            {badge}
          </p>
          <h1 className="text-[1.9rem] leading-tight font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-slate-600">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </main>

        <div className="mx-auto w-full max-w-sm text-[13.5px] text-slate-600">{footer}</div>
      </div>

      {/* The panel: hidden on a phone, where the form is the whole page. */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand to-brand-bright p-12 lg:flex lg:flex-col lg:justify-center">
        <div aria-hidden className="grid-paper absolute inset-0 opacity-20" />
        <div className="relative">
          <h2 className="max-w-sm text-[1.7rem] leading-tight font-extrabold tracking-tight text-white">
            {panelTitle}
          </h2>
          <ul className="mt-8 space-y-4">
            {panelPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[14.5px] text-white/90">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-[11px] font-bold text-slate-900"
                >
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default AuthFrame;
