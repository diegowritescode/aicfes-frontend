import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

/**
 * The shared pieces every internal view is built from.
 *
 * They exist so the rules hold by construction rather than by
 * discipline: a view that uses PageHeader cannot have two primary
 * actions, because PageHeader only takes one.
 */

/* ── Page header ────────────────────────────────────────────────
   One title, one primary action. The old dashboard offered six
   competing calls to action and a learner could not tell which one
   to press; a header that accepts a single `accion` makes that
   impossible to repeat. */

export function PageHeader({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  /** The one thing this page wants the learner to do. */
  accion?: { texto: string; to: string } | { texto: string; onClick: () => void };
  /** Secondary, quiet controls. Never a second primary button. */
  children?: React.ReactNode;
}) {
  const clase =
    'inline-flex items-center justify-center rounded-full bg-brand-bright px-6 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]';

  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900">
          {titulo}
        </h1>
        {descripcion ? (
          <p className="mt-1.5 max-w-xl text-[14.5px] text-slate-600">{descripcion}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2.5">
        {children}
        {accion ? (
          'to' in accion ? (
            <Link to={accion.to} className={clase}>
              {accion.texto}
            </Link>
          ) : (
            <button type="button" onClick={accion.onClick} className={clase}>
              {accion.texto}
            </button>
          )
        ) : null}
      </div>
    </header>
  );
}

/* ── Stat ───────────────────────────────────────────────────────
   A number with its unit and one line of meaning. The meaning line
   is required: "0 días" alone tells a learner nothing. */

export function StatCard({
  etiqueta,
  valor,
  unidad,
  nota,
  acento = 'brand',
}: {
  etiqueta: string;
  valor: string | number;
  unidad?: string;
  nota: string;
  acento?: 'brand' | 'lime' | 'amber' | 'cyan';
}) {
  const color = {
    brand: 'text-brand-bright',
    lime: 'text-lime',
    amber: 'text-amber',
    cyan: 'text-cyan',
  }[acento];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-[12.5px] font-medium text-slate-500">{etiqueta}</p>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span className={`text-[2rem] leading-none font-extrabold tracking-tight ${color}`}>
          {valor}
        </span>
        {unidad ? <span className="text-[14px] font-semibold text-slate-400">{unidad}</span> : null}
      </p>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-500">{nota}</p>
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────────
   Always offers the next step. A new learner used to meet a board
   of zeroes with nothing to press; a zero that does not say what to
   do about it is a dead end. */

export function EmptyState({
  titulo,
  descripcion,
  accion,
  icono,
}: {
  titulo: string;
  descripcion: string;
  accion: { texto: string; to: string };
  icono?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      {icono ? <div className="mb-4 text-slate-300">{icono}</div> : null}
      <h3 className="text-[16px] font-bold text-slate-900">{titulo}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-slate-600">
        {descripcion}
      </p>
      <Link
        to={accion.to}
        className="mt-5 rounded-full bg-brand-bright px-6 py-2.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
      >
        {accion.texto}
      </Link>
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────────
   One heading level below the page title, so the hierarchy is a
   real one: h1 per page, h2 per section. */

export function Section({
  titulo,
  descripcion,
  children,
  className = '',
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`}>
      <h2 className="text-[16px] font-bold tracking-tight text-slate-900">{titulo}</h2>
      {descripcion ? <p className="mt-1 text-[13px] text-slate-500">{descripcion}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ── Progress bar ───────────────────────────────────────────────
   Labelled and announced, so it is readable without seeing it. */

export function ProgressRow({
  etiqueta,
  porcentaje,
  detalle,
  valorTexto,
}: {
  etiqueta: string;
  porcentaje: number;
  detalle?: string;
  /** Shown instead of the percentage, for a bar with nothing to
   *  measure yet: "0%" and "no data" are different facts. */
  valorTexto?: string;
}) {
  const pct = Math.max(0, Math.min(100, porcentaje));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] font-medium text-slate-700">{etiqueta}</span>
        <span className="text-[13px] font-bold text-slate-900 tabular-nums">
          {valorTexto ?? `${pct}%`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={etiqueta}
        className="h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-brand-bright to-cyan"
        />
      </div>
      {detalle ? <p className="mt-1.5 text-[12px] text-slate-500">{detalle}</p> : null}
    </div>
  );
}

/* ── Mode card ──────────────────────────────────────────────────
   One study mode, named for what the learner gets rather than for
   how it works inside. */

export function ModeCard({
  titulo,
  descripcion,
  to,
  duracion,
  destacado = false,
}: {
  titulo: string;
  descripcion: string;
  to: string;
  duracion: string;
  destacado?: boolean;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        to={to}
        className={`block h-full rounded-2xl border p-6 transition-colors ${
          destacado
            ? 'border-brand-bright/40 bg-gradient-to-br from-brand-soft/40 to-white'
            : 'border-slate-200 bg-white hover:border-brand-bright/30'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[16px] font-bold tracking-tight text-slate-900">{titulo}</h3>
          {destacado ? (
            <span className="shrink-0 rounded-full bg-brand-bright px-2.5 py-1 text-[10.5px] font-bold text-white">
              Empieza aquí
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{descripcion}</p>
        <p className="mt-4 text-[12.5px] font-semibold text-slate-400">{duracion}</p>
      </Link>
    </motion.div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────
   Shown while data loads, shaped like the content it replaces, so
   the layout does not jump when it arrives. */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}
