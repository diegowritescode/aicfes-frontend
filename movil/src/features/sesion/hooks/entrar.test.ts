import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

/**
 * Signing in, against the race that actually shipped.
 *
 * The symptom was the worst kind: correct credentials, no error
 * anywhere, the form cleared and still on screen. Three separate
 * defects lined up to produce it, and each one on its own is
 * invisible.
 *
 *   1. `guardar` ran in `onSuccess`, so a failed write still left the
 *      mutation reporting success.
 *   2. `guardar` only invalidated the session query. An invalidation
 *      schedules a refetch; it does not make the value readable now.
 *   3. The screen navigated immediately after. The next screen read
 *      the session before the refetch landed, saw nothing, and
 *      redirected back to the form — which remounted, losing the
 *      typing.
 *
 * None of this involves the server. The server was fine the whole
 * time.
 */

const CLAVE = ['sesion'] as const;
const SESION = { token: 'tok', userId: 'u1', email: 'a@b.c' };

let cliente: QueryClient;
let almacen: Map<string, string>;

beforeEach(() => {
  cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  almacen = new Map();
});

/** The old save: invalidate and hope. */
async function guardarViejo(sesion: typeof SESION) {
  almacen.set('sesion', JSON.stringify(sesion));
  await cliente.invalidateQueries({ queryKey: CLAVE });
}

/** The new save: make it readable, then invalidate. */
async function guardarNuevo(sesion: typeof SESION) {
  almacen.set('sesion', JSON.stringify(sesion));
  cliente.setQueryData(CLAVE, sesion);
  await cliente.invalidateQueries({ queryKey: CLAVE });
}

describe('la sesión está disponible en cuanto se guarda', () => {
  it('el guardado nuevo deja la sesión legible de inmediato', async () => {
    /* This is what the screen after the navigation reads. If it is
       undefined, that screen bounces back to the form. */
    await guardarNuevo(SESION);
    expect(cliente.getQueryData(CLAVE)).toEqual(SESION);
  });

  it('el guardado viejo la dejaba indefinida: la causa del rebote', async () => {
    await guardarViejo(SESION);
    expect(cliente.getQueryData(CLAVE)).toBeUndefined();
  });
});

describe('un guardado fallido no cuenta como sesión iniciada', () => {
  /* The store is wrapped so a write can fail the way a real keystore
     fails: by accepting the call and keeping nothing. */
  async function entrarCon(escribir: () => Promise<void>) {
    const respuesta = { ok: true as const, datos: SESION };
    if (!respuesta.ok) throw new Error('inalcanzable');
    await escribir();
    cliente.setQueryData(CLAVE, SESION);
    return SESION;
  }

  it('si el almacén no guarda nada, entrar falla', async () => {
    const escrituraVacia = async () => {
      /* Accepted, stored nothing — then read back, which is what the
         store now does. */
      const confirmado = almacen.get('sesion') ?? null;
      if (!confirmado) throw new Error('La sesión no quedó guardada.');
    };

    await expect(entrarCon(escrituraVacia)).rejects.toThrow('no quedó guardada');

    /* And the cache was never seeded, so nothing claims a session. */
    expect(cliente.getQueryData(CLAVE)).toBeUndefined();
  });

  it('si el almacén guarda, entrar funciona', async () => {
    const escrituraBuena = async () => {
      almacen.set('sesion', JSON.stringify(SESION));
      if (!almacen.get('sesion')) throw new Error('La sesión no quedó guardada.');
    };

    await expect(entrarCon(escrituraBuena)).resolves.toEqual(SESION);
    expect(cliente.getQueryData(CLAVE)).toEqual(SESION);
  });
});

describe('el código real conserva estas decisiones', () => {
  it('guardar() escribe en el caché, no solo invalida', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const fuente = readFileSync(join(__dirname, 'useSesion.ts'), 'utf8');
    const cuerpo = fuente.slice(fuente.indexOf('const guardar'), fuente.indexOf('const salir'));
    expect(
      cuerpo,
      'guardar() volvió a solo invalidar: la pantalla siguiente puede leer la sesión antes del refetch y rebotar al formulario',
    ).toMatch(/setQueryData\(CLAVE, sesion\)/);
  });

  it('entrar guarda dentro de mutationFn, no en onSuccess', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const fuente = readFileSync(join(__dirname, 'useSesion.ts'), 'utf8');
    expect(
      /onSuccess:\s*guardar/.test(fuente),
      'guardar volvió a onSuccess: un guardado fallido reportaría la sesión como iniciada',
    ).toBe(false);
    expect(fuente).toMatch(/await guardar\(sesion\)/);
  });

  it('el almacén verifica lo que escribió', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const fuente = readFileSync(
      join(__dirname, '../../../core/almacenamiento/sesion.ts'),
      'utf8',
    );
    expect(
      fuente,
      'guardar() dejó de releer lo que escribió: una escritura fallida vuelve a ser invisible',
    ).toMatch(/const confirmado = await leerCrudo/);
  });
});
