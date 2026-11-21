import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { HeroScene } from '@/components/brand/HeroScene';
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
  { id: 'MAT' as const, nombre: 'Matemáticas', n: 50, acento: 'from-violeta/20 to-cyan/10' },
  { id: 'LC' as const, nombre: 'Lectura Crítica', n: 41, acento: 'from-magenta/20 to-violeta/10' },
  { id: 'CN' as const, nombre: 'Ciencias Naturales', n: 58, acento: 'from-cyan/20 to-lime/10' },
  { id: 'SOC' as const, nombre: 'Sociales y Ciudadanas', n: 50, acento: 'from-amber/20 to-magenta/10' },
  { id: 'ING' as const, nombre: 'Inglés', n: 55, acento: 'from-violeta/20 to-magenta/10' },
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
        <span className="font-bold text-violeta">{area.n}</span> preguntas en el examen real
      </p>
    </motion.article>
  );
}

/** A section label: a short rule and a word, as the reference uses. */
function Eyebrow({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p
      className={`mb-4 flex items-center gap-2.5 text-[11px] font-bold tracking-[0.18em] uppercase ${
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
      <section className="relative overflow-hidden bg-ink">
        {/* The particle field sits behind everything and parts around
            the cursor. It is decorative: the page reads without it. */}
        <HeroScene />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-ink/40 to-ink" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.16em] text-cyan uppercase backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
              {hero.eyebrow}
            </p>
            <h1 className="text-[clamp(2.6rem,6.5vw,4.6rem)] leading-[0.98] font-extrabold tracking-tight text-white">
              {hero.titleLine1}
              <br />
              {hero.titleLine2}
              <br />
              <span className="bg-gradient-to-r from-violeta via-magenta to-cyan bg-clip-text text-transparent">
                {hero.titleAccent}
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-[16.5px] leading-relaxed text-slate-300">{hero.body}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/registro"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-violeta to-magenta px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_32px_-8px_hsl(var(--violeta))] transition-transform hover:scale-[1.03]"
              >
                {hero.primary}
              </Link>
              <a
                href="#como"
                className="rounded-xl border border-white/20 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-cyan hover:text-cyan"
              >
                {hero.secondary}
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {hero.reassurance.map((r) => (
                <li key={r} className="flex items-center gap-1.5 text-[12.5px] text-slate-400">
                  <span aria-hidden className="text-lime">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 36, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="hidden justify-self-center lg:block"
            style={{ perspective: 1000 }}
          >
            <QuestionMock />
          </motion.div>
        </div>

        <div className="relative overflow-hidden border-y border-white/10 bg-white/[0.03] py-3.5 backdrop-blur">
          <div className="marquee flex w-max gap-8">
            {[...ticker, ...ticker].map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="flex items-center gap-8 text-[13px] font-semibold whitespace-nowrap text-white/70"
              >
                {t}
                <span aria-hidden className="text-magenta">◆</span>
              </span>
            ))}
          </div>
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
              <span className="bg-gradient-to-r from-violeta to-magenta bg-clip-text text-transparent">
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
                      ? 'bg-gradient-to-br from-brand to-brand-bright text-white'
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
      <section className="border-b border-slate-800/50 bg-slate-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <Eyebrow light>{features.eyebrow}</Eyebrow>
            <h2 className="max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold tracking-tight text-white">
              {features.title}{' '}
              <span className="text-cyan-light">{features.titleAccent}</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.items.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 70}>
                <article className="h-full rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-cyan/40">
                  <h3 className="text-[15px] font-bold text-white">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-400">{f.body}</p>
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
              className="mt-8 inline-block rounded-xl bg-brand px-7 py-3.5 text-[15px] font-bold text-white shadow-xl shadow-brand/25 transition-transform hover:scale-[1.03]"
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
      <section className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-bright py-20 lg:py-28">
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
              className="rounded-xl bg-white px-8 py-3.5 text-[15px] font-bold text-brand shadow-xl transition-transform hover:scale-[1.03]"
            >
              {closing.primary}
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/30 px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
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
