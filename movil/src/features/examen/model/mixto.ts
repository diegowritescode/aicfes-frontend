import type { Area, Dificultad } from '@/shared/model/icfes';

/**
 * How many of each area a mixed run asks for.
 *
 * The real exam is LC 41, MAT 50, SOC 50, CN 58, ING 55 out of 254.
 * Every area gets at least one, because a "mixed" run missing a
 * subject is not mixed — and the remainder goes to the areas that
 * lost the most to rounding, so the parts sum to the whole.
 */
export function repartirMixto(
  total: number,
  dificultad: Dificultad,
): Array<{ area: Area; dificultad: Dificultad; n: number }> {
  const PESOS: Array<[Area, number]> = [
    ['LC', 41],
    ['MAT', 50],
    ['SOC', 50],
    ['CN', 58],
    ['ING', 55],
  ];
  const suma = PESOS.reduce((s, [, p]) => s + p, 0);

  const partes = PESOS.map(([area, peso]) => {
    const exacto = (peso * total) / suma;
    return { area, dificultad, n: Math.max(1, Math.floor(exacto)), resto: exacto % 1 };
  });

  let sobran = total - partes.reduce((s, p) => s + p.n, 0);
  for (const parte of [...partes].sort((a, b) => b.resto - a.resto)) {
    if (sobran <= 0) break;
    parte.n += 1;
    sobran -= 1;
  }

  return partes.map(({ area, dificultad: d, n }) => ({ area, dificultad: d, n }));
}
