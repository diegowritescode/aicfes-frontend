import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * A question on screen must not change while it is being answered.
 *
 * This exists because it happened. The review screen read its
 * questions from a live query; answering saved to the server, which
 * reloaded the list, and the reloaded rows carried new object
 * identities and a new `veces` — both of which feed the shuffle. The
 * question reshuffled underneath the learner, and the answer they had
 * already given started pointing at a different option. Two
 * screenshots two seconds apart showed the same tap marked wrong and
 * then right.
 *
 * The rule: a screen that shows a question holds it in its own state
 * for as long as the learner is answering it. The list behind may
 * change; what is on screen may not.
 *
 * The simulacro is the named exception, and it is checked below
 * rather than ignored.
 */

function leer(ruta: string): string {
  return readFileSync(new URL(`../../${ruta}`, import.meta.url), 'utf8');
}

/* Screens that show options and must hold them. The simulacro is
   absent on purpose; see its own test. */
const PANTALLAS = [
  'features/repaso/components/PantallaRepaso.tsx',
  'features/panel/components/TarjetaErrorDelDia.tsx',
  'features/offline/components/PantallaPeaje.tsx',
  'features/examen/components/PantallaExamen.tsx',
  'app/contrarreloj.tsx',
];

describe('una pregunta en pantalla no se recarga sola', () => {
  it.each(PANTALLAS)('%s no lee de una consulta viva', (ruta) => {
    const fuente = leer(ruta);
    /* `useQuery` here would mean the rows can be replaced mid-answer,
       which is exactly the defect. Questions arrive as props or are
       frozen in state. */
    expect(fuente).not.toMatch(/\buseQuery\s*\(/);
  });

  it('el repaso congela su lista al empezar', () => {
    /* Not just absent of useQuery: it receives a live array as a prop
       and has to snapshot it, or the parent's reload reaches it
       anyway. */
    const fuente = leer('features/repaso/components/PantallaRepaso.tsx');
    expect(fuente).toMatch(/useState<readonly ErrorPendiente\[\]>\(\(\) => errores\)/);
  });

  it('la pregunta del día se congela al montar', () => {
    /* Worse consequences than the review: answering makes the server
       return null for the day, so a live read empties the card while
       the explanation is still being read. */
    const fuente = leer('features/panel/components/TarjetaErrorDelDia.tsx');
    expect(fuente).toMatch(/useState\(\(\) => pregunta\)/);
  });
});

describe('el simulacro es la excepción, y está justificada', () => {
  it('sí lee de una consulta, porque el reloj es del servidor', () => {
    /* A sitting's remaining time is authoritative on the server and
       the phone spends most of a sitting in a pocket. Refetching is
       how someone who was away gets the real time left.
       
       Safe because the order is fixed server-side —
       `unique(simulacroId, orden)` — so a reload returns the same
       questions in the same places. Verified against production. */
    const fuente = leer('features/simulacro/hooks/useSimulacro.ts');
    expect(fuente).toMatch(/\buseQuery\s*\(/);
    expect(fuente).toMatch(/staleTime: 0/);
  });

  it('y no baraja opciones, que es lo que haría inestable el refetch', () => {
    const pantalla = leer('features/simulacro/components/PantallaSimulacro.tsx');
    expect(pantalla).not.toMatch(/rotarOpciones/);
  });
});
