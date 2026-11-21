import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { HeroScene } from '@/components/brand/HeroScene';
import { HeroLines } from '@/components/brand/HeroLines';
import { ILUSTRACIONES } from '@/components/brand/Ilustraciones';
import { Logo } from '@/components/brand/Logo';
import { Reveal } from '@/components/brand/Reveal';
import {
  closing,
  disclaimer,
  faq,
  features,
  hero,
  navLinks,
  problem,
  simulacro,
  steps,
  ticker,
} from './landing/copy';


/** The five exam areas, each with its illustration and accent. */
const AREAS = [
  { id: 'MAT' as const, nombre: 'Matemáticas', n: 50, acento: 'from-brand-bright/10 to-cyan/10' },
  { id: 'LC' as const, nombre: 'Lectura Crítica', n: 41, acento: 'from-cyan/12 to-brand-bright/8' },
  { id: 'CN' as const, nombre: 'Ciencias Naturales', n: 58, acento: 'from-brand-soft/40 to-white' },
  { id: 'SOC' as const, nombre: 'Sociales y Ciudadanas', n: 50, acento: 'from-brand-bright/8 to-brand-soft/30' },
  { id: 'ING' as const, nombre: 'Inglés', n: 55, acento: 'from-cyan/10 to-brand-soft/25' },
];

/** Cards that lift and tilt toward the cursor. */
function TarjetaArea({ area, i }: { area: (typeof AREAS)[number]; i: number }) {
  const Ilustracion = ILUSTRACIONES[area.id];
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${area.acento} p-6`}
    >
      <div className="h-28 w-full">
        <Ilustracion className="transition-transform duration-500 group-hover:scale-105" />
      </div>
      <h3 className="mt-5 text-[17px] font-bold tracking-tight text-slate-900">{area.nombre}</h3>
      <p className="mt-1 text-[13px] text-slate-600">
        <span className="font-bold text-brand-bright">{area.n}</span> preguntas en el examen real
      </p>
    </motion.article>
  );
}


/** A floating label with a small arrow pointing back at the orb. */
function Pildora({
  children,
  className = '',
  flecha,
}: {
  children: React.ReactNode;
  className?: string;
  flecha: 'izquierda' | 'derecha';
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute hidden items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap text-slate-700 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.18)] sm:inline-flex ${className}`}
    >
      {flecha === 'izquierda' && <span aria-hidden className="text-brand-bright">◂</span>}
      {children}
      {flecha === 'derecha' && <span aria-hidden className="text-brand-bright">▸</span>}
    </motion.span>
  );
}

/** A section label: a short rule and a word, as the reference uses. */
function Eyebrow({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p
      className={`mb-4 inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.18em] uppercase ${
        light ? 'text-cyan-light' : 'text-brand-bright'
      }`}
    >
      <span className={`h-px w-7 ${light ? 'bg-cyan-light/60' : 'bg-brand-bright/50'}`} />
      {children}
    </p>
  );
}

/**
 * A mocked-up question, built in HTML rather than a screenshot, so it
 * stays sharp at any size and weighs nothing.
 */
function QuestionMock() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-5 shadow-2xl shadow-brand/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
          Matemáticas
        </span>
        <span className="text-[11px] text-slate-400">Pregunta 3 de 10</span>
      </div>
      <p className="mb-3 rounded-lg bg-slate-50 p-3 text-[12.5px] leading-relaxed text-slate-600">
        Un pintor cobra 150 000 pesos por pintar una habitación de 4 m por 3 m.
      </p>
      <p className="mb-4 text-[14px] font-semibold text-slate-900">
        ¿Cuánto cobrará por un salón de 6 m por 5 m?
      </p>
      <div className="space-y-2">
        {[
          ['A', '360 000 pesos', false],
          ['B', '400 000 pesos', false],
          ['C', '375 000 pesos', true],
          ['D', '385 000 pesos', false],
        ].map(([letter, text, correct]) => (
          <div
            key={letter as string}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px] ${
              correct
                ? 'border-lime bg-lime/10 font-medium text-slate-900'
                : 'border-slate-200 text-slate-600'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                correct ? 'bg-lime text-slate-900' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {letter as string}
            </span>
            {text as string}
            {correct ? <span className="ml-auto text-[11px] font-semibold text-lime">✓</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3">
          <Link to="/" aria-label="AICFES, inicio">
            <Logo />
          </Link>
          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[13.5px] font-medium text-slate-600 transition-colors hover:text-brand"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-[13.5px] font-semibold text-slate-700 transition-colors hover:text-brand"
            >
              Entrar
            </Link>
            <Link
              to="/registro"
              className="rounded-lg bg-brand-bright px-4 py-2 text-[13.5px] font-semibold text-white shadow-lg shadow-brand-bright/25 transition-transform hover:scale-[1.03]"
            >
              Crear cuenta
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="hero-wash relative overflow-hidden">
        <HeroLines className="absolute inset-x-0 bottom-0 h-full w-full" />

        <div className="relative mx-auto max-w-4xl px-5 pt-16 pb-20 text-center lg:pt-20 lg:pb-28">
          {/* The orb floats above the headline, with the pills
              pointing at it, as in the reference. */}
          <div className="relative mx-auto mb-7 h-[190px] w-[190px] lg:h-[230px] lg:w-[230px]">
            <HeroScene className="h-full w-full" />

            <Pildora className="-left-24 top-10 lg:-left-40" flecha="derecha">
              5 áreas
            </Pildora>
            <Pildora className="-right-20 top-6 lg:-right-36" flecha="izquierda">
              254 preguntas
            </Pildora>
            <Pildora className="-left-16 bottom-6 lg:-left-32" flecha="derecha">
              Gratis
            </Pildora>
            <Pildora className="-right-16 bottom-10 lg:-right-28" flecha="izquierda">
              Verificado
            </Pildora>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 py-1.5 pr-3.5 pl-1.5 text-[12.5px] font-medium text-slate-600 shadow-sm backdrop-blur">
              <span className="rounded-full bg-brand-bright px-2.5 py-1 text-[11px] font-bold text-white">
                Nuevo
              </span>
              {hero.eyebrow}
              <span aria-hidden className="text-slate-400">›</span>
            </p>

            <h1 className="text-[clamp(2.3rem,6vw,4rem)] leading-[1.05] font-extrabold tracking-tight text-slate-900">
              {hero.titleLine1}
              <br />
              <span className="text-brand-bright">{hero.titleLine2}</span>
              <br />
              {hero.titleAccent}
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-[15.5px] leading-relaxed text-slate-600">
              {hero.body}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/registro"
                className="rounded-full bg-brand-bright px-7 py-3 text-[14.5px] font-semibold text-white shadow-[0_8px_24px_-8px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.03]"
              >
                {hero.primary}
              </Link>
              <a
                href="#como"
                className="rounded-full border border-brand-bright/40 bg-white/70 px-6 py-3 text-[14.5px] font-semibold text-brand-bright backdrop-blur transition-colors hover:bg-white"
              >
                {hero.secondary}
              </a>
            </div>
          </motion.div>
        </div>

        {/* The trust bar, on white as in the reference. */}
        <div className="relative border-t border-slate-200/70 bg-white py-7">
          <p className="mb-5 text-center text-[12.5px] text-slate-500">
            Construido sobre los cuadernillos oficiales del Saber 11
          </p>
          <ul className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-9 gap-y-4 px-5">
            {ticker.slice(0, 6).map((t) => (
              <li key={t} className="text-[13.5px] font-semibold text-slate-400">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── The problem ────────────────────────────────────────── */}
      <section id="problema" className="border-b border-slate-200/70 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <Eyebrow>{problem.eyebrow}</Eyebrow>
            <h2 className="max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold tracking-tight text-slate-900">
              {problem.title}{' '}
              <span className="text-brand-bright">{problem.titleAccent}</span>
            </h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-slate-600">
              {problem.body}
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {problem.stats.map((s, i) => (
              <Reveal key={s.value} delay={i * 90}>
                <div className="h-full bg-white p-6">
                  <p className="text-[2.6rem] leading-none font-extrabold tracking-tight text-brand">
                    {s.value}
                  </p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── The five areas ─────────────────────────────────────── */}
      <section className="border-b border-slate-200/70 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <Eyebrow>Las cinco áreas</Eyebrow>
            <h2 className="max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold tracking-tight text-slate-900">
              Todo lo que evalúa el Saber 11,{' '}
              <span className="bg-gradient-to-r from-brand-bright to-cyan bg-clip-text text-transparent">
                con el peso que tiene de verdad.
              </span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AREAS.map((area, i) => (
              <TarjetaArea key={area.id} area={area} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section id="como" className="border-b border-slate-200/70 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <Eyebrow>{steps.eyebrow}</Eyebrow>
            <h2 className="max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold tracking-tight text-slate-900">
              {steps.title}{' '}
              <span className="text-brand-bright">{steps.titleAccent}</span>
            </h2>
          </Reveal>

          <div className="mt-14 space-y-4">
            {steps.items.map((step, i) => (
              <Reveal key={step.n} delay={i * 80}>
                <article
                  className={`grid gap-6 rounded-2xl p-7 sm:grid-cols-[auto_1fr] sm:p-9 ${
                    i % 2 === 0
                      ? 'bg-gradient-to-br from-brand-bright to-cyan text-white'
                      : 'border border-slate-200 bg-white'
                  }`}
                >
                  <span
                    className={`text-[2.8rem] leading-none font-extrabold tracking-tight ${
                      i % 2 === 0 ? 'text-white/25' : 'text-slate-200'
                    }`}
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3
                      className={`text-[1.35rem] font-bold tracking-tight ${
                        i % 2 === 0 ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`mt-2.5 max-w-2xl text-[15px] leading-relaxed ${
                        i % 2 === 0 ? 'text-white/85' : 'text-slate-600'
                      }`}
                    >
                      {step.body}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── What is inside ─────────────────────────────────────── */}
      <section className="border-b border-slate-200/70 bg-gradient-to-b from-wash/60 to-white py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <Eyebrow>{features.eyebrow}</Eyebrow>
            <h2 className="mx-auto max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold tracking-tight text-slate-900">
              {features.title}{' '}
              <span className="text-brand-bright">{features.titleAccent}</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.items.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 70}>
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_12px_-6px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-1 hover:border-brand-bright/30 hover:shadow-[0_12px_28px_-12px_rgba(37,99,235,0.3)]">
                  <h3 className="text-[15px] font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{f.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Simulations ────────────────────────────────────────── */}
      <section id="simulacros" className="border-b border-slate-200/70 bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>{simulacro.eyebrow}</Eyebrow>
            <h2 className="text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold tracking-tight text-slate-900">
              {simulacro.title}{' '}
              <span className="text-brand-bright">{simulacro.titleAccent}</span>
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-slate-600">
              {simulacro.body}
            </p>
            <Link
              to="/registro"
              className="mt-8 inline-block rounded-full bg-brand-bright px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_24px_-8px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.03]"
            >
              Hacer un simulacro
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="mb-5 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                Estructura del examen real
              </p>
              <ul className="space-y-3.5">
                {simulacro.areas.map((a) => (
                  <li key={a.area}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[14px] font-semibold text-slate-700">{a.area}</span>
                      <span className="text-[13px] font-bold text-brand tabular-nums">{a.n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-cyan"
                        style={{ width: `${(a.n / 58) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-slate-200 pt-4 text-[12.5px] text-slate-500">
                {simulacro.note}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="border-b border-slate-200/70 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <Eyebrow>{faq.eyebrow}</Eyebrow>
            <h2 className="text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold tracking-tight text-slate-900">
              {faq.title}
            </h2>
          </Reveal>

          <div className="mt-10 space-y-3">
            {faq.items.map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <details className="group rounded-xl border border-slate-200 bg-white px-5 py-4 transition-colors open:border-brand/30">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-slate-900">
                    {item.q}
                    <span
                      aria-hidden
                      className="shrink-0 text-xl leading-none text-brand-bright transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-bright to-cyan py-20 lg:py-28">
        <div aria-hidden className="grid-paper absolute inset-0 opacity-20" />
        <Reveal className="relative mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-[clamp(2rem,5vw,3.2rem)] leading-tight font-extrabold tracking-tight text-white">
            {closing.title}{' '}
            <span className="text-cyan-light">{closing.titleAccent}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[16.5px] text-white/85">{closing.body}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/registro"
              className="rounded-full bg-white px-8 py-3.5 text-[15px] font-bold text-brand-bright shadow-xl transition-transform hover:scale-[1.03]"
            >
              {closing.primary}
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/40 px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              {closing.secondary}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="max-w-md text-[12px] leading-relaxed text-slate-500">{disclaimer}</p>
        </div>
      </footer>
    </div>
  );
}
