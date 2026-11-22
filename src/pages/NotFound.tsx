import { Link, useLocation } from 'react-router-dom';

/**
 * The 404 page was the only screen still in English — "Oops! Page not
 * found", "Return to Home" — in a product whose every other word is
 * Spanish, shown precisely when someone is already lost.
 *
 * It also logged every miss to console.error in production, which
 * only fills the user's console; a wrong URL is not an application
 * error.
 */

export default function NotFound() {
  const location = useLocation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-wash/40 px-4">
      <div className="max-w-md text-center">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-brand-bright">
          Página no encontrada
        </p>
        <h1 className="mt-3 text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900">
          Esta página no existe
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">
          La dirección <span className="font-mono text-[13px] text-slate-500">{location.pathname}</span>{' '}
          no corresponde a ninguna página. Puede que el enlace esté viejo o tenga un error
          de escritura.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-full bg-brand-bright px-7 py-3 text-[14.5px] font-semibold text-white
              shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2"
          >
            Ir a mi progreso
          </Link>
          <Link
            to="/"
            className="rounded-full px-5 py-3 text-[14px] font-semibold text-slate-600 transition-colors hover:text-slate-900
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
