import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AREA_LABELS, Area } from '@/types/icfes';
import { EstadoSimulacro, getSimulacro } from '@/services/api';
import { Button } from '@/components/ui/button';

/**
 * The report a sitting produces, which is the whole reason to sit one.
 *
 * It leads with the areas that went worst, because that ordering is
 * the study plan. A score on its own tells a learner they did badly at
 * something; this tells them at what.
 */

export default function SimulacroResultados() {
  const { id } = useParams<{ id: string }>();
  const [estado, setEstado] = useState<EstadoSimulacro | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      if (!id) return;
      const r = await getSimulacro(id);
      if (!vivo) return;
      setEstado(r.data ?? null);
      setCargando(false);
    })();
    return () => {
      vivo = false;
    };
  }, [id]);

  if (cargando) return <p className="p-8 text-[14px] text-slate-500">Cargando resultados…</p>;

  const resultados = estado?.resultados;
  if (!resultados) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-[14px] text-slate-600">No encontramos los resultados de este simulacro.</p>
        <Button className="mt-4" asChild>
          <Link to="/dashboard">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  const flojas = resultados.areas.filter((a) => a.porcentaje < 70);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Simulacro terminado
      </p>
      <h1 className="mt-2 text-[32px] font-bold tracking-tight text-slate-900">
        {resultados.correctas} de {resultados.total}
      </h1>
      <p className="mt-1 text-[15px] text-slate-600">
        {resultados.porcentaje}% de respuestas correctas.
        {estado?.expirado ? ' Se acabó el tiempo antes de terminar.' : ''}
      </p>

      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Por área, de la más floja a la más firme
        </h2>
        <ul className="mt-4 space-y-3">
          {resultados.areas.map((a) => (
            <li key={a.area} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[14.5px] font-semibold text-slate-800">
                  {AREA_LABELS[a.area as Area] ?? a.area}
                </p>
                <p className="text-[14px] font-bold tabular-nums text-slate-700">{a.porcentaje}%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${a.porcentaje < 70 ? 'bg-amber-400' : 'bg-lime'}`}
                  style={{ width: `${Math.max(2, a.porcentaje)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[12.5px] text-slate-500">
                {a.correctas} de {a.total} correctas
              </p>
            </li>
          ))}
        </ul>
      </section>

      {flojas.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-amber/40 bg-amber/[0.06] p-5">
          <h2 className="text-[14px] font-bold text-slate-800">Por dónde empezar</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">
            {flojas.map((a) => AREA_LABELS[a.area as Area] ?? a.area).join(', ')}. Son las que
            quedaron por debajo del 70%.
          </p>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/dashboard">Volver al inicio</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/simulacro">Hacer otro simulacro</Link>
        </Button>
      </div>
    </div>
  );
}
