import { describe, expect, it } from 'vitest';
import {
  aLegible,
  bloqueadosPorElSistema,
  listoParaBloquear,
  ordenar,
  sePuedeOmitir,
  siguientePendiente,
  textoDelBoton,
  type PasoNativo,
} from './permisos';

/**
 * Permissions, as something a learner can read.
 *
 * The bench showed `paso overlay: undetermined (requerido)` and one
 * button called "pedir el siguiente". These assertions are what
 * replaces that: names instead of ids, and a button that says what it
 * will ask for.
 */

function paso(id: string, status: PasoNativo['status'], required = true): PasoNativo {
  return { id, status, required };
}

describe('de dato de sistema a frase', () => {
  it('traduce el id a algo que se entiende', () => {
    const p = aLegible(paso('overlay', 'undetermined'));
    expect(p.nombre).toBe('Mostrar sobre otras apps');
    expect(p.porQue).toContain('Instagram');
    expect(p.concedido).toBe(false);
  });

  it('un id desconocido no rompe la pantalla', () => {
    /* A module update adding a step must not leave a blank chip. */
    const p = aLegible(paso('loQueSea', 'denied'));
    expect(p.nombre).toBe('loQueSea');
    expect(p.porQue.length).toBeGreaterThan(0);
  });
});

describe('el muro de los ajustes restringidos', () => {
  it('se distingue de un permiso simplemente no dado', () => {
    /* Android refuses the toggle to a sideloaded app and says nothing
       about why. Sending someone to the same screen again does
       nothing, so the fix has to be different — which means the state
       has to be told apart. */
    const normal = aLegible(paso('usageAccess', 'undetermined'));
    const murado = aLegible(paso('usageAccess', 'restricted'));
    expect(normal.bloqueadoPorElSistema).toBe(false);
    expect(murado.bloqueadoPorElSistema).toBe(true);
  });

  it('no se ofrece pedirlo, porque pedirlo no sirve', () => {
    const pasos = [
      aLegible(paso('usageAccess', 'restricted')),
      aLegible(paso('overlay', 'undetermined')),
    ];
    expect(siguientePendiente(pasos)?.id).toBe('overlay');
  });

  it('se puede listar aparte para explicarlo', () => {
    const pasos = [
      aLegible(paso('usageAccess', 'restricted')),
      aLegible(paso('overlay', 'granted')),
    ];
    expect(bloqueadosPorElSistema(pasos).map((p) => p.id)).toEqual(['usageAccess']);
  });
});

describe('el orden', () => {
  it('lo que falta y es obligatorio va primero', () => {
    /* A list that opens with three green chips and buries the red one
       is a list that gets closed. */
    const pasos = [
      aLegible(paso('notifications', 'granted', false)),
      aLegible(paso('overlay', 'granted')),
      aLegible(paso('usageAccess', 'undetermined')),
      aLegible(paso('deviceAdmin', 'undetermined', false)),
    ];
    expect(ordenar(pasos).map((p) => p.id)).toEqual([
      'usageAccess',
      'overlay',
      'deviceAdmin',
      'notifications',
    ]);
  });
});

describe('el botón dice qué va a pedir', () => {
  it('nombra el permiso, no "el siguiente"', () => {
    const pasos = [aLegible(paso('overlay', 'undetermined'))];
    expect(textoDelBoton(siguientePendiente(pasos))).toBe(
      'Permitir: Mostrar sobre otras apps',
    );
  });

  it('cuando no falta nada, lo dice', () => {
    expect(textoDelBoton(null)).toBe('Todo listo');
  });
});

describe('cuándo se puede bloquear', () => {
  it('basta con los obligatorios', () => {
    /* The optional ones make blocking more reliable; demanding them
       would stop a learner who only wants to try the toll. */
    const pasos = [
      aLegible(paso('overlay', 'granted')),
      aLegible(paso('usageAccess', 'granted')),
      aLegible(paso('deviceAdmin', 'undetermined', false)),
    ];
    expect(listoParaBloquear(pasos)).toBe(true);
  });

  it('falta uno obligatorio y no se puede', () => {
    const pasos = [
      aLegible(paso('overlay', 'granted')),
      aLegible(paso('usageAccess', 'denied')),
    ];
    expect(listoParaBloquear(pasos)).toBe(false);
  });
});

/**
 * Passing over a step whose state the phone will not report.
 *
 * Reported from a Xiaomi: the learner turns on «Permitir uso en
 * segundo plano», Settings shows it on, and the app still reads it
 * off — truthfully, because MIUI's switch is not the system's
 * battery-optimization list that `isIgnoringBatteryOptimizations`
 * measures. Those are two different settings.
 *
 * The consequence was not a wrong chip. The queue hands back the
 * first ungranted step, so an undetectable one was a wall: the button
 * kept naming it, and every step behind it — all of them optional —
 * could never be reached. One recommended step stopped the whole
 * setup.
 */
describe('omitir un paso que no se puede detectar', () => {
  const pasos = [
    paso('overlay', 'granted'),
    paso('usageAccess', 'granted'),
    paso('batteryOptimization', 'denied', false),
    paso('deviceAdmin', 'denied', false),
  ].map(aLegible);

  it('sin omitir, el paso que no se detecta tapa a los de atrás', () => {
    expect(siguientePendiente(pasos)?.id).toBe('batteryOptimization');
  });

  it('omitido, la fila sigue con el siguiente', () => {
    expect(siguientePendiente(pasos, ['batteryOptimization'])?.id).toBe('deviceAdmin');
  });

  it('omitir todos los que faltan deja la fila vacía, no colgada', () => {
    expect(
      siguientePendiente(pasos, ['batteryOptimization', 'deviceAdmin']),
    ).toBeNull();
  });

  it('el paso omitido sigue en la lista, para concederlo después', () => {
    /* Skipping is not dismissing. The step keeps its row, its name
       and its reason, because the learner may well grant it on the
       next phone they set this up on. */
    const visibles = ordenar(pasos).map((p) => p.id);
    expect(visibles).toContain('batteryOptimization');
  });

  it('un paso obligatorio no se puede omitir', () => {
    /* Without the required steps the toll blocks nothing. A setup
       that calls itself finished while the feature does nothing is
       worse than a wall: nothing says it failed. */
    const obligatorio = aLegible(paso('overlay', 'denied'));
    const opcional = aLegible(paso('batteryOptimization', 'denied', false));
    expect(sePuedeOmitir(obligatorio)).toBe(false);
    expect(sePuedeOmitir(opcional)).toBe(true);
  });

  it('omitir un obligatorio no lo saca de la fila', () => {
    /* Belt and braces: the screen is what refuses to offer the skip,
       but the queue must not honour one either. */
    const conObligatorio = [
      paso('overlay', 'denied'),
      paso('batteryOptimization', 'denied', false),
    ].map(aLegible);
    expect(siguientePendiente(conObligatorio, ['overlay'])?.id).toBe('overlay');
  });
});
