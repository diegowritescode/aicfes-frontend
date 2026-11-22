import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTest } from '@/context/TestContext';
import { generateMixedItems } from '@/services/api';
import { Area, Dificultad, AREA_LABELS, DIFICULTAD_LABELS } from '@/types/icfes';
import { Layout } from '@/components/Layout';
import { ErrorAlert } from '@/components/ErrorAlert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const AREAS: Area[] = ['MAT', 'LC', 'CN', 'SOC', 'ING'];
const DIFICULTADES: Dificultad[] = ['facil', 'media', 'alta'];
const MAX_ITEMS = 25;

type Section = {
  id: number;
  area: Area | '';
  dificultad: Dificultad | '';
  n: number;
  tema: string;
};

const createSection = (id: number): Section => ({
  id,
  area: '',
  dificultad: '',
  n: 5,
  tema: '',
});

export default function Generate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startTest } = useTest();

  const sectionIdRef = useRef(1);
  const [sections, setSections] = useState<Section[]>([createSection(sectionIdRef.current)]);
  const [shuffle, setShuffle] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const elapsedIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const areaParam = searchParams.get('area');
    const dificultadParam = searchParams.get('dificultad');
    const temaParam = searchParams.get('tema');
    const nParam = searchParams.get('n');

    if (areaParam || dificultadParam || temaParam || nParam) {
      sectionIdRef.current += 1;
      const next = createSection(sectionIdRef.current);
      if (areaParam && AREAS.includes(areaParam as Area)) {
        next.area = areaParam as Area;
      }
      if (dificultadParam && DIFICULTADES.includes(dificultadParam as Dificultad)) {
        next.dificultad = dificultadParam as Dificultad;
      }
      if (temaParam) {
        next.tema = temaParam;
      }
      if (nParam) {
        const parsed = parseInt(nParam, 10);
        if (!Number.isNaN(parsed)) {
          next.n = Math.min(MAX_ITEMS, Math.max(1, parsed));
        }
      }
      setSections([next]);
    }
  }, [searchParams]);

  const totalRequested = useMemo(
    () => sections.reduce((total, section) => total + (Number.isNaN(section.n) ? 0 : section.n), 0),
    [sections]
  );

  const validSections = useMemo(
    () =>
      sections.filter((section) =>
        Boolean(section.area && section.dificultad && section.n >= 1)
      ),
    [sections]
  );

  const updateSection = (id: number, patch: Partial<Section>) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  };

  const addSection = () => {
    sectionIdRef.current += 1;
    setSections((prev) => [...prev, createSection(sectionIdRef.current)]);
  };

  const removeSection = (id: number) => {
    setSections((prev) => (prev.length > 1 ? prev.filter((section) => section.id !== id) : prev));
  };

  const resetLoadingState = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setElapsedSeconds(0);
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  };

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void generar();
  };

  const generar = async () => {
    setError(null);

    if (validSections.length === 0) {
      setError({ code: 'INVALID_SECTIONS', message: 'Completa al menos una sección válida.' });
      return;
    }

    if (totalRequested > MAX_ITEMS) {
      setError({ code: 'MAX_ITEMS', message: `El máximo permitido es ${MAX_ITEMS} preguntas.` });
      return;
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setElapsedSeconds(0);
    elapsedIntervalRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const payload = {
      sections: validSections.map((section) => ({
        area: section.area as Area,
        dificultad: section.dificultad as Dificultad,
        n: section.n,
        tema: section.tema.trim() || undefined,
      })),
      shuffle,
    };

    try {
      const result = await generateMixedItems(payload, { signal });
      resetLoadingState();

      if (!result.success) {
        setError(result.error || { code: 'UNKNOWN', message: 'No se pudo generar la prueba.' });
        return;
      }

      if (result.items.length === 0) {
        setError({ code: 'EMPTY_RESPONSE', message: 'No se generaron preguntas. Intenta de nuevo.' });
        return;
      }

      startTest(result.items, null, {
        mode: 'test',
        sessionId: result.sessionId || null,
      });
      navigate('/test');
    } catch (err) {
      resetLoadingState();
      setError({ code: 'NETWORK_ERROR', message: 'No se pudo conectar con el servidor. Intenta de nuevo.' });
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const excede = totalRequested > MAX_ITEMS;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-10">
        <header className="mb-7">
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-slate-900">
            Practicar un tema
          </h1>
          <p className="mt-1.5 max-w-xl text-[14.5px] leading-relaxed text-slate-600">
            Elija el área, qué tan difícil la quiere y cuántas preguntas. Puede mezclar
            varias áreas en una misma práctica.
          </p>
        </header>

        {/* While the questions are being written there is one place to
            look. The old page showed a skeleton, a blue notice, a
            sidebar card and a loading button all at once, plus a
            progress bar computed as 5 + seconds * 3 that measured
            nothing and stuck at 90%. A bar that does not track real
            progress tells the learner less than the clock does. */}
        {isLoading ? (
          <section
            aria-live="polite"
            className="rounded-3xl border border-brand-soft bg-gradient-to-br from-wash/80 to-white p-8 text-center"
          >
            <Loader2 aria-hidden className="mx-auto h-7 w-7 animate-spin text-brand-bright" />
            <h2 className="mt-4 text-[17px] font-bold text-slate-900">
              Estamos escribiendo sus preguntas
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-slate-600">
              Cada pregunta se escribe y se revisa una por una, así que suele tardar entre
              medio minuto y dos minutos. No cierre esta pestaña.
            </p>
            <p className="mt-5 font-mono text-[22px] tabular-nums text-slate-700">
              {formatElapsed(elapsedSeconds)}
            </p>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-6 rounded-full border border-slate-300 px-6 py-2.5 text-[14px] font-semibold text-slate-700
                transition-colors hover:bg-slate-50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
            >
              Cancelar
            </button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {sections.map((section, index) => (
              <fieldset
                key={section.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <legend className="text-[13px] font-bold text-slate-900">
                    {sections.length > 1 ? `Bloque ${index + 1}` : 'Qué quiere practicar'}
                  </legend>
                  {sections.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="rounded px-2 py-1 text-[13px] font-semibold text-slate-500 transition-colors
                        hover:text-rose-600
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`area-${section.id}`} className="text-[13px] font-medium text-slate-700">
                      Área
                    </Label>
                    <Select
                      value={section.area}
                      onValueChange={(value) => updateSection(section.id, { area: value as Area })}
                    >
                      <SelectTrigger id={`area-${section.id}`} className="mt-1.5">
                        <SelectValue placeholder="Elija un área" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {AREA_LABELS[a]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`dif-${section.id}`} className="text-[13px] font-medium text-slate-700">
                      Qué tan difícil
                    </Label>
                    <Select
                      value={section.dificultad}
                      onValueChange={(value) => updateSection(section.id, { dificultad: value as Dificultad })}
                    >
                      <SelectTrigger id={`dif-${section.id}`} className="mt-1.5">
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
                    <Label htmlFor={`n-${section.id}`} className="text-[13px] font-medium text-slate-700">
                      Cuántas preguntas
                    </Label>
                    <Input
                      id={`n-${section.id}`}
                      className="mt-1.5"
                      type="number"
                      min={1}
                      max={MAX_ITEMS}
                      value={section.n}
                      onChange={(e) =>
                        updateSection(section.id, { n: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`tema-${section.id}`} className="text-[13px] font-medium text-slate-700">
                      Tema <span className="font-normal text-slate-400">(opcional)</span>
                    </Label>
                    <Input
                      id={`tema-${section.id}`}
                      className="mt-1.5"
                      placeholder="Por ejemplo: álgebra"
                      value={section.tema}
                      onChange={(e) => updateSection(section.id, { tema: e.target.value })}
                    />
                    <p className="mt-1.5 text-[12px] text-slate-500">
                      Déjelo vacío para ver de todo el área
                    </p>
                  </div>
                </div>
              </fieldset>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <button
                type="button"
                onClick={addSection}
                className="rounded-full border border-slate-300 px-5 py-2 text-[13.5px] font-semibold text-slate-700
                  transition-colors hover:bg-slate-50
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              >
                Añadir otra área
              </button>

              {/* The limit used to be silent until submit, when it
                  came back as an error. It is now live beside the
                  count. */}
              <p
                aria-live="polite"
                className={`text-[13.5px] font-semibold tabular-nums ${
                  excede ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {totalRequested} de {MAX_ITEMS} preguntas
                {excede ? ' · son demasiadas' : ''}
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <span>
                <span className="block text-[14px] font-semibold text-slate-900">
                  Mezclar las preguntas
                </span>
                <span className="mt-0.5 block text-[12.5px] text-slate-500">
                  Como en el examen real, donde las áreas vienen revueltas
                </span>
              </span>
              <Switch checked={shuffle} onCheckedChange={setShuffle} />
            </label>

            {error ? (
              <ErrorAlert
                title="No pudimos armar la práctica"
                message={error.message}
                code={error.code}
                onRetry={() => void generar()}
              />
            ) : null}

            <button
              type="submit"
              disabled={validSections.length === 0 || excede}
              className="w-full rounded-full bg-brand-bright px-7 py-3.5 text-[15px] font-semibold text-white
                shadow-[0_6px_20px_-6px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.01]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:hover:scale-100"
            >
              {validSections.length === 0
                ? 'Elija un área y un nivel para empezar'
                : `Empezar con ${totalRequested} ${totalRequested === 1 ? 'pregunta' : 'preguntas'}`}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
