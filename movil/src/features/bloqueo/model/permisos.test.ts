import { describe, expect, it } from 'vitest';
import {
  aLegible,
  bloqueadosPorElSistema,
  listoParaBloquear,
  ordenar,
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
