import { useEffect, useState } from 'react';

/**
 * The diagram that goes with a question.
 *
 * Fetched as SVG rather than drawn here: the server owns the templates,
 * so a corrected template reaches every learner without a new release.
 *
 * A question that needs its figure is unanswerable without it, so a
 * failure says so plainly instead of leaving a blank space.
 */
export function QuestionFigure({
  itemId,
  alt,
  className = '',
}: {
  itemId: string;
  alt?: string;
  className?: string;
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    setSvg(null);
    setFallo(false);

    const base = import.meta.env.VITE_API_URL ?? '';
    fetch(`${base}/api/figuras/item/${encodeURIComponent(itemId)}.svg`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((texto) => {
        if (!vigente) return;
        // The server generates this markup from a fixed set of
        // templates; it is not user content.
        setSvg(texto);
      })
      .catch(() => vigente && setFallo(true));

    // A learner can move on before the figure lands.
    return () => {
      vigente = false;
    };
  }, [itemId]);

  if (fallo) {
    return (
      <div className={`rounded-xl border border-amber/40 bg-amber/5 p-4 text-sm text-slate-600 ${className}`}>
        No se pudo cargar la figura de esta pregunta.
        {alt ? <span className="mt-1 block text-slate-500">{alt}</span> : null}
      </div>
    );
  }

  if (!svg) {
    return <div className={`h-48 animate-pulse rounded-xl bg-slate-100 ${className}`} aria-hidden />;
  }

  return (
    <figure className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <div
        className="mx-auto max-w-md [&>svg]:h-auto [&>svg]:w-full"
        role="img"
        aria-label={alt ?? 'Figura de la pregunta'}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </figure>
  );
}

export default QuestionFigure;
