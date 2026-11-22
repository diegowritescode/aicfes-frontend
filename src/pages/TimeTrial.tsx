import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useNavigate } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { Area, Dificultad, AREA_LABELS, DIFICULTAD_LABELS } from '@/types/icfes';
import { getTimeTrialModes, startTimeTrial, TimeTrialMode } from '@/services/api';
import { Timer } from 'lucide-react';
import { TimeTrialModesSkeleton } from '@/components/LoadingSkeleton';

const AREAS: Area[] = ['MAT', 'LC', 'CN', 'SOC', 'ING'];
const DIFICULTADES: Dificultad[] = ['facil', 'media', 'alta'];

export default function TimeTrial() {
  const navigate = useNavigate();
  const { startTest, setStudySessionId } = useTest();

  const [modes, setModes] = useState<TimeTrialMode[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoadingModes, setIsLoadingModes] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  const [customArea, setCustomArea] = useState<Area | ''>('');
  const [customDifficulty, setCustomDifficulty] = useState<Dificultad | ''>('');
  const [customTime, setCustomTime] = useState(10);
  const [customQuestions, setCustomQuestions] = useState(10);

  const cargarModos = useCallback(async () => {
    setError(null);
    setIsLoadingModes(true);
    const result = await getTimeTrialModes();
    setIsLoadingModes(false);
    if (!result.success || !result.data) {
      setError(result.error || { message: 'No se pudieron cargar los retos.' });
      return;
    }
    setModes(result.data);
  }, []);

  useEffect(() => {
    void cargarModos();
  }, [cargarModos]);

  const handleStartMode = async (mode: TimeTrialMode) => {
    setError(null);
    setIsStarting(true);
    const result = await startTimeTrial({ modeId: mode.id });
    setIsStarting(false);
    if (!result.success || !result.data) {
      setError(result.error || { message: 'No se pudo iniciar contrarreloj.' });
      return;
    }
    setStudySessionId(result.data.sessionId);
    startTest(result.data.items, mode.area || null, {
      mode: 'contrarreloj',
      sessionId: result.data.sessionId,
      dificultad: mode.dificultad || null,
      timeLimitSeconds: result.data.timeLimitSeconds,
    });
    navigate('/test');
  };

  const handleStartCustom = async () => {
    if (!customArea || !customDifficulty) {
      setError({ message: 'Selecciona área y dificultad para tu contrarreloj.' });
      return;
    }
    setError(null);
    setIsStarting(true);
    const result = await startTimeTrial({
      custom: {
        area: customArea,
        dificultad: customDifficulty,
        timeLimitSeconds: Math.max(1, customTime) * 60,
        questions: Math.max(1, customQuestions),
      },
    });
    setIsStarting(false);
    if (!result.success || !result.data) {
      setError(result.error || { message: 'No se pudo iniciar contrarreloj.' });
      return;
    }
    setStudySessionId(result.data.sessionId);
    startTest(result.data.items, customArea, {
      mode: 'contrarreloj',
      sessionId: result.data.sessionId,
      dificultad: customDifficulty,
      timeLimitSeconds: result.data.timeLimitSeconds,
    });
    navigate('/test');
  };

  /* How long each question gets is the number that decides whether a
     challenge is hard. The learner had to work it out themselves. */
  const segundosPorPregunta = useMemo(() => {
    if (customQuestions < 1) return null;
    return Math.round((customTime * 60) / customQuestions);
  }, [customTime, customQuestions]);


  const formatoPorPregunta = (segundos: number | null) => {
    if (segundos === null) return null;
    if (segundos < 60) return `${segundos} s por pregunta`;
    const min = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return resto === 0
      ? `${min} min por pregunta`
      : `${min} min ${resto} s por pregunta`;
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-10">
        <header className="mb-6">
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900">
            Contrarreloj
          </h1>
          <p className="mt-1.5 max-w-xl text-[14.5px] leading-relaxed text-slate-600">
            Responda contra el reloj, como el día del examen. Si se acaba el tiempo, la
            práctica termina donde iba.
          </p>
        </header>

        {/* The exam screen plays a ticking clock in this mode. Starting
            audio the learner did not ask for is a WCAG 1.4.2 problem;
            the least we can do is say so before they start. */}
        <p className="mb-6 flex items-start gap-2 rounded-2xl bg-amber/10 px-4 py-3 text-[13px] leading-relaxed text-slate-700">
          <Timer aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
          Este modo lleva un tic-tac que se oye mientras responde. Baje el volumen si
          prefiere practicar en silencio.
        </p>

        {error ? (
          <div className="mb-6">
            <ErrorAlert
              title="No pudimos iniciar"
              message={error.message}
              code={error.code}
              onRetry={() => void cargarModos()}
            />
          </div>
        ) : null}

        <section>
          <h2 className="mb-3 text-[16px] font-bold tracking-tight text-slate-900">
            Retos listos
          </h2>

          {isLoadingModes ? (
            <TimeTrialModesSkeleton />
          ) : modes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
              <p className="text-[14px] text-slate-600">
                No hay retos disponibles en este momento.
              </p>
              <button
                type="button"
                onClick={() => void cargarModos()}
                className="mt-4 rounded-full border border-slate-300 px-5 py-2 text-[13.5px] font-semibold text-slate-700
                  transition-colors hover:bg-slate-50
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              >
                Volver a buscar
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {modes.map((mode) => {
                const porPregunta = Math.round(mode.timeLimitSeconds / mode.questions);
                return (
                  <li key={mode.id}>
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-bold text-slate-900">{mode.title}</h3>
                        <p className="mt-0.5 text-[13.5px] leading-relaxed text-slate-600">
                          {mode.description}
                        </p>
                        <p className="mt-2 text-[12.5px] font-semibold text-slate-500">
                          {Math.round(mode.timeLimitSeconds / 60)} min ·{' '}
                          {mode.questions} preguntas · {formatoPorPregunta(porPregunta)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartMode(mode)}
                        disabled={isStarting}
                        className="shrink-0 rounded-full bg-brand-bright px-6 py-2.5 text-[14px] font-semibold text-white
                          shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02]
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2
                          disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:hover:scale-100"
                      >
                        {isStarting ? 'Preparando…' : 'Empezar'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
            O arme el suyo
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Elija cuánto tiempo y cuántas preguntas.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tt-area" className="text-[13px] font-medium text-slate-700">
                Área
              </Label>
              <Select value={customArea} onValueChange={(value) => setCustomArea(value as Area)}>
                <SelectTrigger id="tt-area" className="mt-1.5">
                  <SelectValue placeholder="Elija un área" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {AREA_LABELS[area]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tt-dif" className="text-[13px] font-medium text-slate-700">
                Qué tan difícil
              </Label>
              <Select
                value={customDifficulty}
                onValueChange={(value) => setCustomDifficulty(value as Dificultad)}
              >
                <SelectTrigger id="tt-dif" className="mt-1.5">
                  <SelectValue placeholder="Elija el nivel" />
                </SelectTrigger>
                <SelectContent>
                  {DIFICULTADES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DIFICULTAD_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tt-min" className="text-[13px] font-medium text-slate-700">
                Minutos en total
              </Label>
              <Input
                id="tt-min"
                className="mt-1.5"
                type="number"
                min={1}
                value={customTime}
                onChange={(event) => setCustomTime(parseInt(event.target.value) || 1)}
              />
            </div>

            <div>
              <Label htmlFor="tt-n" className="text-[13px] font-medium text-slate-700">
                Cuántas preguntas
              </Label>
              <Input
                id="tt-n"
                className="mt-1.5"
                type="number"
                min={1}
                value={customQuestions}
                onChange={(event) => setCustomQuestions(parseInt(event.target.value) || 1)}
              />
            </div>
          </div>

          {/* The pace, worked out for them. This is the number that
              decides whether the challenge is hard. */}
          <p aria-live="polite" className="mt-4 text-[13.5px] font-semibold text-slate-600">
            {segundosPorPregunta !== null ? `Le quedan ${formatoPorPregunta(segundosPorPregunta)}` : ''}
          </p>

          <button
            type="button"
            onClick={handleStartCustom}
            disabled={isStarting || !customArea || !customDifficulty}
            className="mt-5 w-full rounded-full bg-brand-bright px-7 py-3.5 text-[15px] font-semibold text-white
              shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.01]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2
              disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:hover:scale-100"
          >
            {isStarting
              ? 'Preparando…'
              : !customArea || !customDifficulty
                ? 'Elija un área y un nivel'
                : `Empezar: ${customQuestions} preguntas en ${customTime} min`}
          </button>
        </section>
      </div>
    </Layout>
  );
}
