import { describe, expect, it } from 'vitest';
import { anunciar, valeLaPenaIntentar, type Situacion } from './conexion';

/**
 * What the learner is told about the network.
 *
 * The failure being avoided is a banner that cries outage over a
 * working screen. Do that twice and the learner stops reading banners,
 * including the one that matters.
 */

function situacion(p: Partial<Situacion> = {}): Situacion {
  return { conexion: 'con-red', hayDatos: true, esDeCache: false, ...p };
}

describe('con red no se dice nada', () => {
  it('ni siquiera si los datos son de caché', () => {
    expect(anunciar(situacion({ esDeCache: true })).tipo).toBe('nada');
  });
});

describe('sin red, depende de si hay algo que mostrar', () => {
  it('con datos guardados, es una nota al pie', () => {
    const a = anunciar(situacion({ conexion: 'sin-red', esDeCache: true }));
    expect(a.tipo).toBe('aviso');
    if (a.tipo !== 'nada') expect(a.mensaje).toContain('lo último que guardamos');
  });

  it('sin nada guardado, es toda la pantalla', () => {
    const a = anunciar(situacion({ conexion: 'sin-red', hayDatos: false }));
    expect(a.tipo).toBe('bloqueo');
    /* And it says what to do about it, because "sin conexión" alone
       leaves a learner tapping retry forever on a first launch. */
    if (a.tipo !== 'nada') expect(a.mensaje).toContain('Conéctate una vez');
  });

  it('nunca grita sobre datos que sirven', () => {
    // The whole point: a blocking message over a usable dashboard is
    // how banners become invisible.
    expect(anunciar(situacion({ conexion: 'sin-red', hayDatos: true })).tipo).not.toBe(
      'bloqueo',
    );
  });
});

describe('mientras no se sabe, no se alarma', () => {
  it('en el arranque frío no se anuncia nada', () => {
    /* The radio has not answered yet. A flash of "sin conexión" for a
       network that is fine is worse than a moment of silence. */
    expect(anunciar(situacion({ conexion: 'desconocido', hayDatos: false })).tipo).toBe(
      'nada',
    );
  });

  it('y sí se intenta la petición', () => {
    // Being wrong here costs one failed request. Refusing to try costs
    // a request that would have worked.
    expect(valeLaPenaIntentar('desconocido')).toBe(true);
  });
});

describe('cuándo no vale intentar', () => {
  it('sin red, no se intenta', () => {
    /* A request with no radio fails after a timeout — on a 200-second
       route that is three minutes of waiting for a failure we could
       have named at once. */
    expect(valeLaPenaIntentar('sin-red')).toBe(false);
  });

  it('con red, sí', () => {
    expect(valeLaPenaIntentar('con-red')).toBe(true);
  });
});
