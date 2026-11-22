import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

/**
 * Signing out, tested against a real QueryClient.
 *
 * This exists because the sign-out button did nothing. The store was
 * cleared and the token was gone, but the screen never re-rendered,
 * so the learner stayed on a dashboard they had just left — and only
 * discovered it by tapping something else, which bounced them to
 * sign-in. Three symptoms, one cause.
 *
 * The cause was `clear()` followed by `invalidateQueries()`: the
 * first discards the observers, the second then notifies nobody.
 * These tests pin the order, so the next person to touch this
 * function cannot restore it by accident.
 */

const CLAVE = ['sesion'] as const;

/** What the old implementation did, kept to prove the tests detect it. */
async function salirRoto(cliente: QueryClient) {
  cliente.clear();
  await cliente.invalidateQueries({ queryKey: CLAVE });
}

/** What it does now. */
async function salirArreglado(cliente: QueryClient) {
  cliente.setQueryData(CLAVE, null);
  cliente.removeQueries({
    predicate: (consulta) => consulta.queryKey[0] !== CLAVE[0],
  });
}

let cliente: QueryClient;

beforeEach(() => {
  cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  cliente.setQueryData(CLAVE, { token: 'tok', userId: 'u1', email: 'a@b.c' });
  cliente.setQueryData(['panel'], { puntaje: 310 });
  cliente.setQueryData(['misiones'], [{ id: 'm1' }]);
});

describe('salir avisa a quien está mirando', () => {
  it('un observador de la sesión se entera', async () => {
    /* This is the whole bug: a screen subscribed to the session must
       be told, or its `<Redirect>` never runs. */
    const visto: unknown[] = [];
    const cancelar = cliente.getQueryCache().subscribe((evento) => {
      if (evento.query.queryKey[0] === 'sesion') visto.push(evento.type);
    });

    await salirArreglado(cliente);
    cancelar();

    expect(visto.length).toBeGreaterThan(0);
    expect(cliente.getQueryData(CLAVE)).toBeNull();
  });

  it('la versión vieja dejaba la sesión indefinida, no nula', async () => {
    /* `undefined` is "never loaded" and makes a screen show its
       spinner forever; `null` is "nobody is signed in", which is what
       the guard checks. The difference is why the dashboard stayed up. */
    await salirRoto(cliente);
    expect(cliente.getQueryData(CLAVE)).toBeUndefined();
  });
});

describe('salir borra los datos del que se va', () => {
  it('el panel y las misiones desaparecen', async () => {
    // A shared phone is the normal case here, not the edge case.
    await salirArreglado(cliente);
    expect(cliente.getQueryData(['panel'])).toBeUndefined();
    expect(cliente.getQueryData(['misiones'])).toBeUndefined();
  });

  it('pero la entrada de sesión sobrevive, en null', async () => {
    /* Removing it too would drop the observers again and bring the
       original bug back in a different shape. */
    await salirArreglado(cliente);
    const entradas = cliente.getQueryCache().getAll().map((c) => c.queryKey[0]);
    expect(entradas).toContain('sesion');
    expect(entradas).not.toContain('panel');
  });
});

describe('salir no falla', () => {
  it('llamarlo dos veces no revienta', async () => {
    // The button can be tapped twice before the screen changes.
    await salirArreglado(cliente);
    await expect(salirArreglado(cliente)).resolves.toBeUndefined();
    expect(cliente.getQueryData(CLAVE)).toBeNull();
  });

  it('sin nada en caché tampoco', async () => {
    const vacio = new QueryClient();
    await expect(salirArreglado(vacio)).resolves.toBeUndefined();
    expect(vacio.getQueryData(CLAVE)).toBeNull();
  });
});

describe('el código real conserva este orden', () => {
  it('salir() no usa clear()', async () => {
    /* The implementation cannot be imported here — it pulls in
       expo-secure-store, which does not parse on Node — so this reads
       the source. Narrow, but it is what catches a revert. */
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const fuente = readFileSync(join(__dirname, 'useSesion.ts'), 'utf8');
    const cuerpoSalir = fuente.slice(fuente.indexOf('const salir'));

    expect(
      /clienteConsultas\.clear\(\)/.test(cuerpoSalir),
      'salir() volvió a usar clear(), que descarta los observadores y deja el botón sin efecto',
    ).toBe(false);
    expect(cuerpoSalir).toMatch(/setQueryData\(CLAVE, null\)/);
  });
});
