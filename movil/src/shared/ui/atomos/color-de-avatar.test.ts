import { describe, expect, it } from 'vitest';
import { colorDe, inicialesDe, ranuraDe } from './color-de-avatar';

/**
 * Avatars drawn from the alias.
 *
 * The property that matters is stability: a learner has to recognise
 * their friend by colour at a glance, so the same alias must give the
 * same avatar on every device, every launch and offline.
 */

describe('las iniciales', () => {
  it('toma una letra de un nombre de una palabra', () => {
    /* Not «CA» for Camilo: two letters from one word read as a
       different name, one letter reads as the name. */
    expect(inicialesDe('camilo')).toBe('C');
  });

  it('toma dos de un nombre de dos palabras', () => {
    expect(inicialesDe('ana maria')).toBe('AM');
  });

  it('ignora las palabras de más', () => {
    expect(inicialesDe('juan pablo segundo tercero')).toBe('JP');
  });

  it('sube a mayúscula', () => {
    expect(inicialesDe('diego')).toBe('D');
  });

  it('sin alias muestra una interrogación, no un vacío', () => {
    /* An empty circle looks like a bug. A «?» looks like someone who
       has not chosen a name, which is what it is. */
    expect(inicialesDe(null)).toBe('?');
    expect(inicialesDe('')).toBe('?');
    expect(inicialesDe('   ')).toBe('?');
  });

  it('aguanta acentos y emoji sin cortarlos a la mitad', () => {
    /* `[...p][0]` and not `p[0]`: an emoji is two code units, and
       indexing would render half of one. */
    expect(inicialesDe('Ángela')).toBe('Á');
    expect(inicialesDe('🐱 gato')).toBe('🐱G');
  });
});

describe('el color', () => {
  it('el mismo alias da siempre el mismo color', () => {
    /* The whole point. A friend whose colour changes between launches
       is a friend you cannot recognise at a glance. */
    expect(colorDe('camilo')).toBe(colorDe('camilo'));
  });

  it('no distingue mayúsculas', () => {
    /* Aliases are stored lowercased, but a cached copy or a display
       name could arrive otherwise and the avatar must not change. */
    expect(colorDe('Camilo')).toBe(colorDe('camilo'));
  });

  it('ignora espacios alrededor', () => {
    expect(colorDe(' camilo ')).toBe(colorDe('camilo'));
  });

  it('reparte nombres parecidos en colores distintos', () => {
    /* The reason for a real hash: `length % n` or a sum of character
       codes would put «ana», «ema» and «eva» on the same colour, and
       short similar aliases are exactly what a class of teenagers
       has. */
    const colores = new Set(
      ['ana', 'ema', 'eva', 'ivan', 'juan', 'luis', 'sara', 'nico'].map(colorDe),
    );

    expect(colores.size).toBeGreaterThanOrEqual(5);
  });

  it('quien no tiene alias no comparte color con quien sí', () => {
    /* Everyone without an alias sharing a colour would make them look
       like the same person; giving them the hash of '' would be that
       exact bug. */
    const sinAlias = colorDe(null);

    expect(colorDe('')).toBe(sinAlias);
    expect(colorDe('camilo')).not.toBe(sinAlias);
  });

  it('siempre devuelve un color legible', () => {
    for (const alias of ['a', 'bb', 'ccc', 'nombre largo de verdad', '123']) {
      expect(colorDe(alias)).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
