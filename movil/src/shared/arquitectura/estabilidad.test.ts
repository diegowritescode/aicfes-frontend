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
  'features/duelos/components/PantallaRondaDeDuelo.tsx',
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

  it('la ronda de duelo congela sus preguntas y no las vuelve a pedir', () => {
    /* A duel is the worst place for this defect: both players are
       scored on the same five questions, so a question that changes
       mid-round costs the duel for a reason the learner cannot see.

       The screen gets its questions from a hook, so the freeze has to
       be asserted there — the screen passing the `useQuery` check is
       not enough on its own. */
    const fuente = leer('features/duelos/hooks/useRondaDeDuelo.ts');
    expect(fuente).toMatch(/setCongeladas\(llegaron\)/);
    /* And the query itself must not refetch underneath the freeze: a
       refetch that lands between mount and freeze would seed the
       round from a different list. */
    expect(fuente).toMatch(/staleTime:\s*Infinity/);
    expect(fuente).toMatch(/refetchOnMount:\s*false/);
    expect(fuente).toMatch(/refetchOnWindowFocus:\s*false/);
  });

  it('la moderación no se asoma sin token en el teléfono', () => {
    /* Three places could leak the existence of a moderation queue to a
       learner: the home notice, the drawer entry and the screen
       itself. Each is gated, and each gate is asserted here because
       the failure is invisible in testing — whoever develops this has
       a token on their device, so they would never see the leaked
       version. */
    const aviso = leer('features/moderacion/components/AvisoDeDenuncias.tsx');
    expect(aviso).toMatch(/if \(!token\.tiene \|\| !pendientes\.mensaje\) return null;/);

    const menu = leer('shared/navegacion/model/menu.ts');
    expect(menu).toMatch(/tieneToken \? \[MODERACION\] : \[\]/);

    /* And the requests refuse to go out without one, so a screen
       reached by typing the path cannot read the queue either. */
    const peticiones = leer('features/moderacion/api/peticiones.ts');
    expect(peticiones).toMatch(/if \(!cabeceras\) return SIN_TOKEN;/);
  });

  it('el menú lee el token desde core, no desde features', () => {
    /* `shared` importing from `features` is a layer violation that
       `capas.test.ts` catches, and the first version of this did it.
       Pinned separately because the fix is easy to undo. */
    const hook = leer('shared/navegacion/useHayTokenDeModeracion.ts');
    expect(hook).toMatch(/from '@\/core\/almacenamiento\/moderacion'/);
    /* Only a boolean leaves it: the drawer has no business holding the
       secret. */
    expect(hook).toMatch(/: boolean/);
  });

  it('el duelo no recibe la respuesta correcta', () => {
    /* Not a stability property but the same kind of defect: something
       on screen that must not be there. Both players are scored on
       these questions, so a client that knows the answer decides the
       duel by reading a response body. The server omits it; this
       asserts the client never learned to expect it. */
    const esquemas = leer('features/duelos/api/esquemas.ts');
    const preguntaDeDuelo = esquemas.slice(
      esquemas.indexOf('export const preguntaDeDuelo'),
      esquemas.indexOf('export const preguntasDeDuelo'),
    );
    expect(preguntaDeDuelo).not.toMatch(/respuesta_correcta/);
    expect(preguntaDeDuelo).not.toMatch(/explicaciones/);
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
