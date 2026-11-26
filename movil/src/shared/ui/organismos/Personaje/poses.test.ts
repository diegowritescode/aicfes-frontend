import { describe, expect, it } from 'vitest';
import { POSES, puntoDeEscritura, RECORRIDO_PARPADO, OJO, type Pose } from './poses';

/**
 * The character's geometry, checked.
 *
 * Both of these caught real bugs during the prototype. The pencil
 * floated 90px off the page for two rounds because the origin was
 * placed where the tip belonged, and `fallo` once had the character
 * looking straight at the learner, which is the one thing the design
 * forbids.
 */

describe('la punta del lápiz', () => {
  it.each(Object.keys(POSES) as Pose[])('cae sobre el papel en %s', (nombre) => {
    const lib = POSES[nombre].libreta;
    const o = puntoDeEscritura(lib);

    /* Where the tip ends up once the pencil is rotated. */
    const a = (o.rot * Math.PI) / 180;
    const punta = {
      x: o.x + 6.5 * Math.cos(a) - 88 * Math.sin(a),
      y: o.y + 6.5 * Math.sin(a) + 88 * Math.cos(a),
    };

    /* The centre of the page, rotated with the notepad. */
    const r = (lib.rot * Math.PI) / 180;
    const papel = {
      x: lib.x + 46 * Math.cos(r) - 58 * Math.sin(r),
      y: lib.y + 46 * Math.sin(r) + 58 * Math.cos(r),
    };

    expect(Math.hypot(punta.x - papel.x, punta.y - papel.y)).toBeLessThan(1);
  });
});

describe('a dónde mira', () => {
  /* The single rule that separates a recorder from a disappointed
     teacher: at the moment of failure it looks at its notepad. */
  it('en fallo mira la página, no al estudiante', () => {
    expect(POSES.fallo.mirada[1]).toBeGreaterThan(0.4);
  });

  it('solo invocado y celebra hacen contacto visual', () => {
    const conContacto = (Object.keys(POSES) as Pose[]).filter(
      (p) => Math.abs(POSES[p].mirada[0]) < 0.1 && Math.abs(POSES[p].mirada[1]) < 0.15,
    );
    expect(conContacto.sort()).toEqual(['celebra', 'invocado']);
  });

  it('en espera no mira ni al frente ni a la página', () => {
    expect(Math.abs(POSES.espera.mirada[0])).toBeGreaterThan(0.2);
  });
});

describe('los párpados', () => {
  it('se quedan dentro del recorrido', () => {
    for (const p of Object.values(POSES)) {
      expect(p.parpado).toBeGreaterThanOrEqual(0);
      expect(p.parpado).toBeLessThanOrEqual(1);
    }
  });

  it('el recorrido cubre el ojo entero', () => {
    expect(RECORRIDO_PARPADO).toBeGreaterThan(OJO.ry * 2);
  });
});

describe('la celebración', () => {
  /* Earned once, in one place. If a second pose celebrated, finishing
     a simulacro would stop meaning that something was hard. */
  it('es la única pose que se endereza y cierra la libreta', () => {
    expect(POSES.celebra.inclina).toBeLessThan(0);
    expect(POSES.celebra.lapiz).toBe(false);
    const otrasSinLapiz = (Object.keys(POSES) as Pose[]).filter(
      (p) => p !== 'celebra' && !POSES[p].lapiz,
    );
    expect(otrasSinLapiz).toEqual(['espera']);
  });
});
