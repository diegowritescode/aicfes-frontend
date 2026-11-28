import { describe, expect, it } from 'vitest';
import {
  objetivosParaDesbloquear,
  resumenDeSaldos,
  textoDeSaldos,
} from './saldos';

/**
 * One balance per blocked app.
 *
 * Reported from real use: eight minutes left on Instagram, five
 * questions answered for Facebook, and the eight were gone. The
 * module says why — "A new call replaces any active unlock" — and
 * the fix is to grant per target instead.
 */

describe('a qué apps se les da tiempo', () => {
  it('solo aplicaciones', () => {
    /* A category covers apps we cannot enumerate, so granting
       against it hands out time nobody can account for. */
    const objetivos = objetivosParaDesbloquear([
      { handle: 'a1', type: 'application' },
      { handle: 'c1', type: 'category' },
      { handle: 'w1', type: 'webDomain' },
      { handle: 'a2', type: 'application' },
    ]);
    expect(objetivos).toEqual(['a1', 'a2']);
  });

  it('una selección vacía no pide nada', () => {
    expect(objetivosParaDesbloquear([])).toEqual([]);
  });
});

describe('lo que se muestra', () => {
  it('sin saldo, no dice nada', () => {
    expect(textoDeSaldos([])).toBeNull();
    expect(textoDeSaldos([{ handle: 'a', segundos: 0 }])).toBeNull();
  });

  it('con una app, da el número', () => {
    expect(textoDeSaldos([{ handle: 'a', segundos: 480 }])).toBe('Te quedan 8 minutos');
  });

  it('un minuto va en singular', () => {
    expect(textoDeSaldos([{ handle: 'a', segundos: 30 }])).toBe('Te queda 1 minuto');
  });

  it('con varias, no los suma', () => {
    /* Adding them would imply they can be spent together, and they
       cannot: each only runs down inside its own app. Saying "23
       minutos" over 8 and 15 is the same kind of lie that started
       this. */
    const texto = textoDeSaldos([
      { handle: 'a', segundos: 480 },
      { handle: 'b', segundos: 900 },
    ]);
    expect(texto).toBe('Tienes tiempo en 2 apps, hasta 15 min en una');
    expect(texto).not.toContain('23');
  });

  it('las agotadas no cuentan', () => {
    const texto = textoDeSaldos([
      { handle: 'a', segundos: 0 },
      { handle: 'b', segundos: 600 },
    ]);
    expect(texto).toBe('Te quedan 10 minutos');
  });
});

describe('el resumen', () => {
  it('toma el mayor, no el total', () => {
    const r = resumenDeSaldos([
      { handle: 'a', segundos: 120 },
      { handle: 'b', segundos: 600 },
    ]);
    expect(r).toEqual({ conTiempo: 2, minutosMaximos: 10 });
  });
});
