import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every tab screen announces itself the same way.
 *
 * Reported from a phone: the headings «son un desorden, no respetan
 * un mismo font size». Measured, they were two different styles —
 * Inicio, Repaso and Yo at `titulo` (21px), Entrenar and Jugar at
 * `titulo-grande` (28px). Nothing enforced either, so each screen got
 * whatever the one before it happened to use.
 *
 * `titulo-grande` is the one that stays. A screen title has to sit
 * above the section headings inside it, and `titulo` is what several
 * cards already use for their own headings — at the same size, the
 * page name reads as one more card.
 *
 * This is a file-reading check because the project has no render
 * environment. It pins the style name, which is what drifted.
 */

const PESTANAS = join(__dirname, '../../app/(pestanas)');

/** The screens with a tab in the bar. `_layout` is not one. */
function pantallas(): string[] {
  return readdirSync(PESTANAS)
    .filter((f) => f.endsWith('.tsx') && !f.startsWith('_'))
    .sort();
}

function leer(archivo: string): string {
  return readFileSync(join(PESTANAS, archivo), 'utf8');
}

/**
 * The first heading in a file, which is the screen's own.
 *
 * Headings further down belong to sections and cards, and those are
 * free to be smaller — that is the hierarchy, not a violation of it.
 */
function primerTitulo(fuente: string): string | null {
  const m = fuente.match(/<Texto estilo="(titulo|titulo-grande)"/);
  return m ? m[1]! : null;
}

describe('las pestañas usan un solo tamaño de título', () => {
  it('hay cinco pantallas con pestaña', () => {
    /* If a sixth appears, it has to be considered here rather than
       silently skipped. */
    expect(pantallas()).toEqual([
      'entrenar.tsx',
      'inicio.tsx',
      'jugar.tsx',
      'repaso.tsx',
      'yo.tsx',
    ]);
  });

  for (const archivo of pantallas()) {
    it(`${archivo} abre con titulo-grande`, () => {
      const estilo = primerTitulo(leer(archivo));

      expect(estilo, `${archivo} no tiene título de pantalla`).not.toBeNull();
      expect(estilo, `${archivo} usa «${estilo}» en vez de «titulo-grande»`).toBe(
        'titulo-grande',
      );
    });
  }

  it('todas coinciden entre sí', () => {
    /* The assertion the complaint was actually about: not which size,
       but that they are not the same. */
    const estilos = new Set(pantallas().map((a) => primerTitulo(leer(a))));

    expect(estilos.size, `hay ${estilos.size} estilos distintos: ${[...estilos].join(', ')}`).toBe(1);
  });
});

describe('la jerarquía dentro de una pantalla se mantiene', () => {
  it('Yo usa un tamaño menor para el número del nivel', () => {
    /* Guarding against a careless find-and-replace: the level number
       sits inside a card and is not a page title. An earlier pass at
       this nearly changed it. */
    const yo = leer('yo.tsx');

    expect(yo).toMatch(/<Texto estilo="titulo">\{panel\.level\.level\}<\/Texto>/);
  });
});
