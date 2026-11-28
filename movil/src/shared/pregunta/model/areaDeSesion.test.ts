import { describe, expect, it } from 'vitest';
import { areaDeSesion } from './areaDeSesion';

/**
 * Which area a session is filed under.
 *
 * This exists because of a defect verified against production: the
 * server rejects `area: "MIXTO"` with a 400, the client sent it
 * anyway, and every mixed training run therefore failed to create a
 * session. The learner practised and nothing counted — no error, no
 * message, just a streak that did not move.
 */

describe('un área concreta se respeta', () => {
  it.each(['MAT', 'LC', 'CN', 'SOC', 'ING'] as const)('%s pasa tal cual', (area) => {
    expect(areaDeSesion(area)).toBe(area);
  });
});

describe('una sesión mixta se archiva bajo la más usada', () => {
  it('la que más preguntas aportó', () => {
    const repartidas = [
      { area: 'MAT' as const },
      { area: 'MAT' as const },
      { area: 'MAT' as const },
      { area: 'LC' as const },
    ];
    expect(areaDeSesion('MIXTO', repartidas)).toBe('MAT');
  });

  it('nunca devuelve MIXTO, que es lo que el servidor rechaza', () => {
    /* The whole point. Any value here must be one of the five the
       schema lists, or the session is never created. */
    const validas = ['MAT', 'LC', 'CN', 'SOC', 'ING'];
    expect(validas).toContain(areaDeSesion('MIXTO', [{ area: 'ING' }]));
    expect(validas).toContain(areaDeSesion('MIXTO', []));
    expect(validas).toContain(areaDeSesion('MIXTO'));
  });

  it('sin nada que contar, cae en MAT', () => {
    // The largest block of the real exam, so the least wrong default.
    expect(areaDeSesion('MIXTO', [])).toBe('MAT');
  });

  it('con empate, elige una de las empatadas', () => {
    const r = areaDeSesion('MIXTO', [{ area: 'LC' }, { area: 'CN' }]);
    expect(['LC', 'CN']).toContain(r);
  });
});
