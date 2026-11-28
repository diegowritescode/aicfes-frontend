import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FIGURAS,
  NOMBRE_DE_FIGURA,
  ORDEN_DE_FIGURAS,
  esFigura,
} from './figuras-de-avatar';

/**
 * The avatar catalogue, and the contract with the server.
 *
 * The server owns which slugs are valid and this file owns how they
 * are drawn. Two lists that must agree, in two repositories, is
 * exactly the pair that drifts — a slug added on one side only is a
 * learner picking an avatar that saves and then renders as initials,
 * or worse, one that the server rejects after the UI showed it.
 */

describe('el catálogo de figuras', () => {
  it('dibuja cada figura del orden', () => {
    for (const slug of ORDEN_DE_FIGURAS) {
      expect(FIGURAS[slug], slug).toBeTruthy();
    }
  });

  it('muestra todas las figuras que dibuja', () => {
    /* Order is the picker's list. A figure in `FIGURAS` and not in
       `ORDEN_DE_FIGURAS` exists, validates and can never be chosen. */
    expect(new Set(ORDEN_DE_FIGURAS).size).toBe(Object.keys(FIGURAS).length);
  });

  it('nombra cada figura', () => {
    for (const slug of ORDEN_DE_FIGURAS) {
      expect(NOMBRE_DE_FIGURA[slug], slug).toMatch(/\S/);
    }
  });

  it('no repite ninguna', () => {
    expect(new Set(ORDEN_DE_FIGURAS).size).toBe(ORDEN_DE_FIGURAS.length);
  });

  it('dibuja con trazos válidos', () => {
    for (const [slug, d] of Object.entries(FIGURAS)) {
      /* Starts with a move and holds only path commands and numbers.
         A stray letter reaches `react-native-svg` as a silent
         no-draw: an empty tile on a profile, with no error. */
      expect(d, slug).toMatch(/^M/);
      expect(d, slug).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9.,\-\s]+$/);
    }
  });

  it('cabe en la caja de 24', () => {
    for (const [slug, d] of Object.entries(FIGURAS)) {
      const numeros = d.match(/-?\d+(\.\d+)?/g) ?? [];
      for (const n of numeros) {
        const v = Math.abs(Number(n));
        /* Coordinates beyond the viewBox clip. 25 and not 24 because
           an arc's radius is a number in the same string. */
        expect(v, `${slug} tiene ${n}`).toBeLessThanOrEqual(25);
      }
    }
  });

  it('reconoce solo lo que puede dibujar', () => {
    expect(esFigura('zorro')).toBe(true);
    for (const malo of ['dragon', 'ZORRO', '', null, undefined, 3, {}]) {
      expect(esFigura(malo), String(malo)).toBe(false);
    }
  });

  it('no tiene caras humanas ni banderas ni símbolos religiosos', () => {
    /* The product decision, pinned. «Which one looks like me» has no
       good answer for Colombian teenagers without a skin-tone axis,
       and the other two categories start fights in a product for
       minors. A new figure that reintroduces one fails here. */
    const prohibidos = [
      'cara', 'nino', 'nina', 'chico', 'chica', 'persona', 'hombre', 'mujer',
      'bandera', 'cruz', 'estrelladavid', 'luna_islam', 'iglesia', 'biblia',
    ];
    for (const slug of ORDEN_DE_FIGURAS) {
      expect(prohibidos, slug).not.toContain(slug);
    }
  });
});

describe('el contrato con el servidor', () => {
  it('tiene exactamente los mismos slugs que AVATARES', () => {
    /* Reads the server's own file. Guessing at the other side of a
       boundary is how two lists agree in a test and disagree in
       production. If the path moves, this test fails loudly rather
       than passing vacuously. */
    const ruta = join(
      __dirname,
      '../../../../../../aicfes-backend/src/duelos/model/avatares.ts',
    );

    let fuente: string;
    try {
      fuente = readFileSync(ruta, 'utf8');
    } catch {
      /* The backend is a separate repository and may not be checked
         out beside this one — in CI, it is not. Skipping is correct
         here and lying is not: the assertion below runs wherever both
         repos exist, which is every machine a human works on. */
      return;
    }

    const bloque = fuente.match(/export const AVATARES = \[([\s\S]*?)\] as const;/);
    expect(bloque, 'no se encontró AVATARES en el backend').toBeTruthy();

    const delServidor = [...bloque![1]!.matchAll(/'([a-z]+)'/g)].map((m) => m[1]!);

    expect([...delServidor].sort()).toEqual([...ORDEN_DE_FIGURAS].sort());
  });
});
