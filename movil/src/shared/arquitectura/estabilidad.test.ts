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

  it('el peaje guarda cada respuesta, no solo al final', () => {
    /* Saving on completion would lose exactly the case persistence
       exists for: the learner who leaves midway. Before this, someone
       on question 2 of 5 could press back, reopen the blocked app and
       start again at zero — which is not an escape hatch, it is the
       absence of a door. */
    const hook = leer('features/offline/hooks/useBloqueoPersistido.ts');

    /* Each function is sliced out and checked on its own. A regex
       spanning both found `avanzar`'s write while `responder`'s was
       deleted and still passed — a test that cannot fail is worse
       than no test, because it is counted as coverage. */
    const cuerpoDe = (nombre: string): string => {
      const desde = hook.indexOf(`const ${nombre} = useCallback`);
      expect(desde, `falta ${nombre}`).toBeGreaterThan(-1);
      /* Cut at the next `useCallback`, not the next `const`: the
         first `const` inside is a local and would truncate the body
         before the write this asserts. */
      const siguiente = hook.indexOf('= useCallback', desde + 20);
      if (siguiente === -1) return hook.slice(desde);
      const corte = hook.lastIndexOf('const ', siguiente);
      return hook.slice(desde, corte);
    };

    expect(cuerpoDe('responder')).toMatch(/guardarSesion/);
    expect(cuerpoDe('avanzar')).toMatch(/guardarSesion/);
  });

  it('el gesto de atrás no sale del peaje', () => {
    /* What makes the toll a toll rather than an announcement. The
       exits that remain are deliberate: clearing the block, spending
       an emergency, or an empty pool. */
    const ruta = leer('app/peaje.tsx');
    expect(ruta).toMatch(/addEventListener\('hardwareBackPress', \(\) => true\)/);
  });

  it('la salida de emergencia sigue contada', () => {
    /* The shield's second button opens this screen rather than
       granting minutes itself. The module offers a native `snooze`
       that would be one tap fewer — and unlimited, because the
       shield has no memory of how many times it was pressed today.
       An unlimited way out is the button a procrastinator presses
       every time, which is the toll not existing.

       So: the shield opens the app, and the count stays where a
       count can live. */
    const escudo = leer('features/bloqueo/model/escudo.ts');
    expect(escudo).toMatch(/ACCION_SECUNDARIA = \{ type: 'openApp' \}/);
    expect(escudo).not.toMatch(/type: 'snooze'/);

    const salida = leer('app/salida.tsx');
    expect(salida).toMatch(/puedeUsarEmergencia\(uso\)/);
    expect(salida).toMatch(/guardarEmergencias\(siguiente\)/);
    /* And back does not walk past it, as it does not in the toll. */
    expect(salida).toMatch(/hardwareBackPress', \(\) => true/);
  });

  it('cada app bloqueada tiene su propio tiempo', () => {
    /* Reported from real use with two apps blocked: eight minutes
       left on Instagram, five questions answered for Facebook, and
       the eight were gone. The module explains it — "A new call
       replaces any active unlock" — so a whole-block grant cannot
       serve more than one app.

       Each grant is targeted now, which the module treats
       independently: "a second targeted grant on the same target
       replaces the first", the same one and not every one. */
    const hook = leer('features/bloqueo/hooks/useBloqueo.ts');
    expect(hook).toMatch(/desbloqueoTemporal\(segundos, \{[\s\S]{0,80}handle,/);

    /* And `blockSelection` cancels every unlock, so ticking one more
       app in the picker silently destroyed earned time. The grants
       are reissued after it. */
    const aplicar = hook.slice(
      hook.indexOf('const aplicar'),
      hook.indexOf('const quitarTodo'),
    );
    expect(aplicar).toMatch(/leerSaldos\(\)/);
    expect(aplicar.indexOf('nativo.bloquear')).toBeLessThan(
      aplicar.indexOf('leerSaldos()'),
    );
  });

  it('la limpieza no revoca los minutos ganados', () => {
    /* Reported from a real phone, and the worst failure this feature
       can have: eight questions answered, back to Inicio, open
       Instagram — blocked again. The toll took the work and did not
       pay.

       The cause was a fix from an hour earlier. The breathing room
       granted on arrival is revoked on unmount, and `relock` ends
       *every* active grant — including the reward handed out a
       moment before. The cleanup is now conditional. */
    const ruta = leer('app/peaje.tsx');
    expect(ruta).toMatch(/if \(!concedido\.current\) void nativo\.terminarRespiro\(\)/);
    /* And both paths that grant minutes have to set the flag, or the
       cleanup takes them back. */
    expect((ruta.match(/concedido\.current = true/g) ?? []).length).toBe(2);
  });

  it('el peaje cobra por fallar, no solo por tocar', () => {
    /* Reported on the first day of real use, by the person who built
       it: "puedo simplemente no leer la pregunta, y darle con mi
       dedo". Clearing the block only required answering, so the toll
       charged for tapping and tapping is what it got.

       Two properties hold the rescoring. The block draws up to the
       ceiling, or a mistake has no question to add. And the screen
       counts against what the block asks, not what it drew. */
    const ruta = leer('app/peaje.tsx');
    expect(ruta).toMatch(/tomarBloque\(TECHO\)/);

    const pantalla = leer('features/offline/components/PantallaPeaje.tsx');
    expect(pantalla).toMatch(/estaPagado\(\{ avanzadas, fallos, disponibles/);
    /* The count on screen runs against what the block ASKS, not what
       it drew. Matched on the prop rather than on a sentence, because
       the redesign moved the number from a line of text into the
       progress bar and the property is what matters. */
    expect(pantalla).toMatch(/total=\{pedidas\}/);
    /* And the surcharge is visible: the bar grows when you fail,
       which is what communicates the cost without a word of
       reproach. */
    expect(pantalla).toMatch(/recargo=\{pedidas - BASE_DE_PREGUNTAS\}/);
  });

  it('una emergencia no borra el avance', () => {
    /* Otherwise the way out doubles as a free reset of work already
       done, and answering two questions then escaping is cheaper than
       answering five. */
    const ruta = leer('app/peaje.tsx');
    const usar = ruta.slice(ruta.indexOf('const usarEmergencia'));
    expect(usar.slice(0, 400)).not.toMatch(/terminar\(\)/);
  });

  it('pagar el peaje concede los minutos, y en ese orden', () => {
    /* The grant comes after the answers are queued, so a learner who
       earned their minutes keeps them even if the queue write fails.
       The other order takes the time away over a bookkeeping error —
       which, from the learner's side, is the app cheating. */
    const ruta = leer('app/peaje.tsx');
    const pagar = ruta.slice(ruta.indexOf('const pagar'), ruta.indexOf('const usarEmergencia'));
    expect(pagar).toMatch(/conceder\(MINUTOS_DESBLOQUEO\)/);
    expect(pagar.indexOf('cola.añadir')).toBeLessThan(pagar.indexOf('conceder('));
  });

  it('venir del escudo lleva al peaje, no a Inicio', () => {
    /* Reported from a real phone: the block worked, the shield
       appeared, "Resolverlas" opened AICFES — and landed on Inicio.
       The shield opens the app and says nothing about why, so
       something has to read the interaction and route.

       It lives at the root layout because Android usually resumes
       the existing process: a check inside Inicio would miss every
       launch that resumed on another screen. */
    const layout = leer('app/_layout.tsx');
    expect(layout).toMatch(/useLlegadaDelEscudo\(\)/);
    /* Each shield button to its own screen: Resolverlas to the
       exercises, Ver opciones to the choices where the counted
       emergency lives. Sending the second one to the exercises is
       the opposite of what was tapped. */
    expect(layout).toMatch(/boton === 'secondary' \? '\/salida' : '\/peaje'/);
    /* `replace`, not `push`: leaving Inicio underneath would make the
       back gesture — which both screens block — the way out. */
    expect(layout).toMatch(/router\.replace\(/);
  });

  it('el escudo abre la app en vez de solo cerrarse', () => {
    /* `openApp` is what turns a wall into a toll: the learner lands
       on the exercises. `unblock` would lift the shield for nothing
       and `close` sends them home having learned nothing. */
    const escudo = leer('features/bloqueo/model/escudo.ts');
    expect(escudo).toMatch(/ACCION_PRINCIPAL = \{ type: 'openApp' \}/);
  });

  it('no se bloquea sin permisos, ni se dice que sí', () => {
    /* Reported from a real phone: the screen said "1 app bloqueada"
       while nothing was blocked. The permissions call had the wrong
       name, so the app did not know they were missing, blocked
       anyway, and reported success.

       That is the worst failure this feature can have — it tells a
       learner they are protected when they are not — so two things
       are pinned: the block is refused when a required permission is
       missing, and the result is read back from the system instead
       of assumed. */
    const hook = leer('features/bloqueo/hooks/useBloqueo.ts');
    const aplicar = hook.slice(
      hook.indexOf('const aplicar'),
      hook.indexOf('const quitarTodo'),
    );
    expect(aplicar).toMatch(/if \(!listoParaBloquear\(pasos\)\)/);
    expect(aplicar).toMatch(/estaBloqueado\(\)/);
    /* And the refusal happens before the native call, not after. */
    expect(aplicar.indexOf('listoParaBloquear')).toBeLessThan(
      aplicar.indexOf('nativo.bloquear'),
    );
  });

  it('seleccionar una app la bloquea, sin botón de por medio', () => {
    /* "What is selected is blocked" explains itself. A separate
       Block button leaves a state where something is picked and
       nothing is blocked, and no label makes that clear. */
    const ruta = leer('app/bloqueo.tsx');
    expect(ruta).toMatch(/alCambiar=\{\(\) => void bloqueo\.aplicar\(\)\}/);
  });

  it('el selector nativo recibe una altura', () => {
    /* It measures itself from the style React Native gives it, and
       without one it lays out at zero: the first real-device test
       showed an empty box and the module looked broken. */
    const selector = leer('features/bloqueo/components/SelectorDeApps.tsx');
    expect(selector).toMatch(/style=\{\{ flex: 1 \}\}/);
  });

  it('hay una forma de llegar a moderación la primera vez', () => {
    /* The drawer entry for Denuncias appears once the device holds a
       token, and the screen that takes the token was behind that
       entry: a door whose key is inside the room. Whoever moderates
       could never get in.

       The way in is a line in the duel settings screen. Pinned here
       because the gating above is the kind of rule that gets
       tightened without noticing it closed the last door. */
    const ajustes = leer('features/duelos/components/PantallaAjustesDeDuelos.tsx');
    expect(ajustes).toMatch(/router\.push\('\/moderacion'\)/);
  });

  it('la moderación no se asoma a un estudiante cualquiera', () => {
    /* Three places could tell a learner that a report queue exists:
       the home notice, the drawer entry and the screen itself. Each
       is gated on holding the role or a token, and each gate is
       asserted here because the failure is invisible in testing —
       whoever develops this has one, so they would never see the
       leaked version.

       Updated when the role landed (ADR 34): the condition widened
       from "has a token" to "moderates, or has a token", and the
       property did not change. */
    const aviso = leer('features/moderacion/components/AvisoDeDenuncias.tsx');
    expect(aviso).toMatch(/if \(!token\.tiene \|\| !pendientes\.mensaje\) return null;/);

    const menu = leer('shared/navegacion/model/menu.ts');
    expect(menu).toMatch(/tieneToken \? \[MODERACION\] : \[\]/);

    const nav = leer('shared/navegacion/useHayTokenDeModeracion.ts');
    expect(nav).toMatch(/return esModerador \|\| hayToken;/);

    /* And the screen shows the paste box rather than the queue when
       neither applies. */
    const pantalla = leer('features/moderacion/components/PantallaModeracion.tsx');
    expect(pantalla).toMatch(/if \(!puede\) \{/);
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
