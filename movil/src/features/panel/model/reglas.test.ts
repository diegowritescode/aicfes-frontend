import { describe, expect, it } from 'vitest';
import { avanceDeNivel, filasDeArea, misionesPendientes, muestraRacha } from './reglas';
import type { Panel } from '../api/esquemas';

function panel(extra: Partial<Panel> = {}): Panel {
  return {
    streak: { currentDays: 0, longestDays: 0, nextMilestoneDays: 3, lastStudyDate: '' },
    level: { level: 1, totalXp: 0, currentXp: 0, nextLevelXp: 100 },
    timeStudied: { weekMinutes: 0, lastSessionAt: '' },
    missions: { total: 0, completed: 0, items: [] },
    areaProgress: [],
    suggestedChallenge: null,
    ...extra,
  };
}

describe('áreas', () => {
  it('un área sin practicar no es un área floja', () => {
    /* The reported bug: "fallé una de inglés y me sigue diciendo 0".
       The number was right; the screen was not. English read 0%
       because one question was missed, and Matemáticas read 0%
       because nothing had been answered at all — two very different
       facts drawn identically, with the unmeasured ones on top. */
    const filas = filasDeArea(
      panel({
        areaProgress: [
          { area: 'MAT', accuracy: 0, questions: 0 },
          { area: 'ING', accuracy: 0, questions: 1 },
          { area: 'LC', accuracy: 80, questions: 5 },
        ],
      }),
    );
    expect(filas.map((f) => f.area)).toEqual(['ING', 'LC', 'MAT']);
    expect(filas[0]).toMatchObject({ area: 'ING', medida: true, porcentaje: 0 });
    expect(filas[2]).toMatchObject({ area: 'MAT', medida: false });
  });

  it('cuenta los aciertos a partir del porcentaje', () => {
    const filas = filasDeArea(
      panel({ areaProgress: [{ area: 'MAT', accuracy: 60, questions: 5 }] }),
    );
    expect(filas[0]).toMatchObject({ aciertos: 3, preguntas: 5 });
  });
});

describe('nivel', () => {
  it('va de 0 a 1', () => {
    expect(avanceDeNivel(panel({ level: { level: 2, totalXp: 150, currentXp: 50, nextLevelXp: 100 } }))).toBe(0.5);
  });

  it('no divide por cero', () => {
    expect(avanceDeNivel(panel({ level: { level: 9, totalXp: 999, currentXp: 10, nextLevelXp: 0 } }))).toBe(0);
  });

  it('nunca pasa de 1', () => {
    // XP can overshoot between a mission completing and the level
    // recalculating; a bar wider than its track looks broken.
    expect(avanceDeNivel(panel({ level: { level: 1, totalXp: 0, currentXp: 150, nextLevelXp: 100 } }))).toBe(1);
  });
});

describe('misiones', () => {
  it('las más cerca de terminar primero', () => {
    const orden = misionesPendientes(
      panel({
        missions: {
          total: 3,
          completed: 0,
          items: [
            { id: 'a', title: 'A', status: 'pending', progress: 1, target: 10, xpReward: 10 },
            { id: 'b', title: 'B', status: 'pending', progress: 4, target: 5, xpReward: 10 },
            { id: 'c', title: 'C', status: 'completed', progress: 5, target: 5, xpReward: 10 },
          ],
        },
      }),
    ).map((m) => m.id);
    expect(orden).toEqual(['b', 'a']);
  });
});

describe('racha', () => {
  it('no se muestra en cero', () => {
    // "0 días" to someone who has never studied is a reproach.
    expect(muestraRacha(panel())).toBe(false);
    expect(
      muestraRacha(panel({ streak: { currentDays: 1, longestDays: 1, nextMilestoneDays: 3, lastStudyDate: '2026-11-22' } })),
    ).toBe(true);
  });
});
