import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';
import { iniciarSimulacro, listarSimulacros } from '@/services/api';
import { Button } from '@/components/ui/button';

/**
 * Choosing a sitting, and resuming one that is still open.
 *
 * The unfinished sitting is at the top for a reason: a learner whose
 * connection dropped at question 40 comes back here, and the thing
 * they need is the way back in, not a new sitting that throws the
 * first forty away.
 */

const LARGOS = [
  { preguntas: 25, titulo: 'Corto', minutos: 27, para: 'Para medir cómo va, sin bloquear la tarde.' },
  { preguntas: 50, titulo: 'Medio', minutos: 53, para: 'El equilibrio entre señal y tiempo.' },
  { preguntas: 100, titulo: 'Largo', minutos: 106, para: 'Ya se parece al cansancio del examen.' },
  { preguntas: 254, titulo: 'Completo', minutos: 270, para: 'El examen entero, al ritmo real.' },
];

export default function SimulacroInicio() {
  const navigate = useNavigate();
  const [iniciando, setIniciando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<{ id: string; totalPreguntas: number } | null>(null);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const r = await listarSimulacros();
      if (!vivo || !r.success) return;
      const enCurso = (r.data ?? []).find((s) => s.status === 'en_curso');
      if (enCurso) setAbierto({ id: enCurso.id, totalPreguntas: enCurso.totalPreguntas });
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const empezar = async (preguntas: number) => {
    setIniciando(preguntas);
    setError(null);
    const r = await iniciarSimulacro(preguntas);
    setIniciando(null);
    if (!r.success || !r.data?.id) {
      setError(r.error?.message ?? 'No se pudo iniciar el simulacro.');
      return;
    }
    navigate(`/simulacro/${r.data.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Simulacro</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
        Como el examen real: puede saltar preguntas, volver atrás y cambiar lo que respondió. No
        sabrá si acertó hasta entregar.
      </p>

      {abierto ? (
        <section className="mt-6 rounded-2xl border border-brand-bright/40 bg-brand-soft/20 p-5">
          <h2 className="text-[14.5px] font-bold text-slate-800">Tiene un simulacro sin terminar</h2>
          <p className="mt-1 text-[13.5px] text-slate-600">
            De {abierto.totalPreguntas} preguntas. El tiempo sigue corriendo desde que lo empezó.
          </p>
          <Button className="mt-3" asChild>
            <Link to={`/simulacro/${abierto.id}`}>Continuar donde iba</Link>
          </Button>
        </section>
      ) : null}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {LARGOS.map((largo) => (
          <li key={largo.preguntas}>
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[15px] font-bold text-slate-900">{largo.titulo}</p>
              <p className="mt-1 flex items-center gap-3 text-[12.5px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <FileText aria-hidden className="h-3.5 w-3.5" />
                  {largo.preguntas} preguntas
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden className="h-3.5 w-3.5" />
                  {largo.minutos} min
                </span>
              </p>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600">{largo.para}</p>
              <Button
                className="mt-4"
                variant="outline"
                disabled={iniciando !== null}
                onClick={() => void empezar(largo.preguntas)}
              >
                {iniciando === largo.preguntas ? 'Preparando…' : 'Empezar'}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-[13.5px] text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
