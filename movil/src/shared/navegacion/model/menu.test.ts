import { describe, expect, it } from 'vitest';
import { ENTRADAS, entradaActiva, entradasDePrueba, esDelMenu } from './menu';

/**
 * What the menu offers.
 *
 * The order is a product decision and this is where it is argued:
 * practice first because that is the product, the toll second because
 * leading with it would make the app feel like it is about blocking
 * rather than about studying.
 */

describe('lo que ofrece', () => {
  it('empieza por entrenar', () => {
    expect(ENTRADAS[0]!.ruta).toBe('/entrenar');
  });

  it('el peaje va segundo, no primero', () => {
    /* It is the strongest mechanic and the one nobody reaches for on
       their own. Leading with it changes what the app is about. */
    expect(ENTRADAS[1]!.ruta).toBe('/peaje');
  });

  it('cada entrada dice qué es antes de tocarla', () => {
    for (const e of ENTRADAS) {
      expect(e.titulo.length).toBeGreaterThan(0);
      expect(e.descripcion.length).toBeGreaterThan(10);
    }
  });

  it('no hay rutas repetidas', () => {
    const rutas = ENTRADAS.map((e) => e.ruta);
    expect(new Set(rutas).size).toBe(rutas.length);
  });
});

describe('saber dónde estás', () => {
  it('reconoce una ruta del menú', () => {
    expect(esDelMenu('/entrenar')).toBe(true);
    expect(esDelMenu('/inicio')).toBe(false);
  });

  it('una ruta con parámetros sigue siendo la suya', () => {
    /* `/simulacro/abc123` is still the simulacro entry, or the menu
       would stop marking where the learner is the moment they open
       one. */
    expect(entradaActiva('/simulacro/abc123')?.ruta).toBe('/simulacro');
  });

  it('una ruta ajena no marca nada', () => {
    expect(entradaActiva('/inicio')).toBeNull();
  });
});

/**
 * The bench used to be gated on `__DEV__`, which is false in a preview
 * APK — so it vanished from the one build handed to someone to test
 * the native module with. These two assertions are the regression.
 */
describe('banco de pruebas', () => {
  it('aparece en un build de prueba', () => {
    expect(entradasDePrueba(true).map((e) => e.ruta)).toEqual(['/bloqueo-prueba']);
  });

  it('no aparece en el build de tienda', () => {
    expect(entradasDePrueba(false)).toEqual([]);
  });
});
