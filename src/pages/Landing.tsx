import { Link } from 'react-router-dom';
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
      <section className="brand-glow relative overflow-hidden border-b border-slate-200/70">
        <div aria-hidden className="grid-paper absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <Reveal>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
            <h1 className="text-[clamp(2.4rem,6vw,4rem)] leading-[1.03] font-extrabold tracking-tight text-slate-900">
              {hero.titleLine1}
              <br />
              {hero.titleLine2}
              <br />
              <span className="bg-gradient-to-r from-brand-bright to-cyan bg-clip-text text-transparent">
                {hero.titleAccent}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-slate-600">{hero.body}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/registro"
                className="rounded-xl bg-brand-bright px-7 py-3.5 text-[15px] font-bold text-white shadow-xl shadow-brand-bright/30 transition-transform hover:scale-[1.03]"
              >
                {hero.primary}
              </Link>
              <a
                href="#como"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-700 transition-colors hover:border-brand hover:text-brand"
              >
                {hero.secondary}
              </a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {hero.reassurance.map((r) => (
                <li key={r} className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
                  <span aria-hidden className="text-lime">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={150} className="hidden justify-self-center lg:block">
            <QuestionMock />
          </Reveal>
        </div>

        {/* The ticker, duplicated so the loop has no seam. */}
        <div className="relative overflow-hidden border-t border-slate-200/70 bg-brand py-3">
          <div className="marquee flex w-max gap-8">
            {[...ticker, ...ticker].map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="flex items-center gap-8 text-[13px] font-semibold whitespace-nowrap text-white/85"
              >
                {t}
                <span aria-hidden className="text-cyan-light">◆</span>
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
