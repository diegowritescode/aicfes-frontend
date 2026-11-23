import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

/**
 * What the learner sees when their token has aged out: nothing.
 *
 * Before this, a 401 was reported as "su sesión expiró" and the
 * learner was sent to a sign-in form — for a session that could have
 * been renewed silently. The point of these tests is that the retry
 * happens, happens once, and does not happen where it would be wrong.
 */

vi.mock('@/core/config/entorno', () => ({
  entorno: { apiUrl: 'https://api.test', esProduccion: true },
}));

vi.mock('@/core/almacenamiento/sesion', () => ({
  almacenSesion: {
    leer: () => Promise.resolve({ token: 'tok', userId: 'u1', email: 'a@b.co' }),
    guardar: () => Promise.resolve(),
    borrar: () => Promise.resolve(),
  },
}));

const renovar = vi.fn();
vi.mock('./renovacion', () => ({
  renovarSesion: () => renovar(),
  registrarRenovador: () => {},
  reiniciarRenovacion: () => {},
}));

const { pedir } = await import('./cliente');

const esquema = z.object({ id: z.string() });

function respuesta(estado: number, cuerpo: unknown) {
  return Promise.resolve({
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: () => Promise.resolve(cuerpo),
  } as Response);
}

beforeEach(() => {
  renovar.mockReset();
  vi.unstubAllGlobals();
});

describe('un 401 se intenta arreglar antes de molestar al estudiante', () => {
  it('renueva y repite la petición, que entonces funciona', async () => {
    renovar.mockResolvedValue({ token: 'nuevo', userId: 'u1', email: 'a@b.co' });
    let llamadas = 0;
    vi.stubGlobal('fetch', () => {
      llamadas += 1;
      return llamadas === 1
        ? respuesta(401, { ok: false })
        : respuesta(200, { ok: true, data: { id: 'listo' } });
    });

    const r = await pedir({ ruta: '/api/dashboard', esquema });

    expect(renovar).toHaveBeenCalledTimes(1);
    expect(llamadas).toBe(2);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.datos).toEqual({ id: 'listo' });
  });

  it('si no se puede renovar, el fallo sí llega como sesión expirada', async () => {
    // Only now is a sign-in screen honest.
    renovar.mockResolvedValue(null);
    vi.stubGlobal('fetch', () => respuesta(401, { ok: false }));

    const r = await pedir({ ruta: '/api/dashboard', esquema });

    expect(renovar).toHaveBeenCalledTimes(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fallo.codigo).toBe('sin_sesion');
  });

  it('no entra en bucle si la ruta sigue dando 401', async () => {
    /* A route that answers 401 for a reason renewal cannot fix — a
       permission, say — would otherwise retry forever and hang the
       screen it was called from. */
    renovar.mockResolvedValue({ token: 'nuevo', userId: 'u1', email: 'a@b.co' });
    let llamadas = 0;
    vi.stubGlobal('fetch', () => {
      llamadas += 1;
      return respuesta(401, { ok: false });
    });

    const r = await pedir({ ruta: '/api/dashboard', esquema });

    expect(llamadas).toBe(2);
    expect(renovar).toHaveBeenCalledTimes(1);
    expect(r.ok).toBe(false);
  });
});

describe('dónde NO se renueva', () => {
  it('un 401 al entrar es una contraseña mala, no una sesión vieja', async () => {
    /* Renewing here would be nonsense: there is no session yet. And it
       would replace "esa contraseña no es" with "su sesión expiró",
       which sends the learner to fix the wrong thing. */
    vi.stubGlobal('fetch', () => respuesta(401, { ok: false }));

    const r = await pedir({ ruta: '/api/auth/login', esquema, conSesion: false });

    expect(renovar).not.toHaveBeenCalled();
    expect(r.ok).toBe(false);
  });

  it('un 429 no se renueva: la cuota no es la sesión', async () => {
    vi.stubGlobal('fetch', () =>
      respuesta(429, { ok: false, error: { code: 'CUOTA_AGOTADA', message: 'Mañana.' } }),
    );

    const r = await pedir({ ruta: '/api/items/generate', esquema });

    expect(renovar).not.toHaveBeenCalled();
    if (!r.ok) expect(r.fallo.codigo).toBe('sin_cuota');
  });

  it('un 500 tampoco', async () => {
    vi.stubGlobal('fetch', () => respuesta(500, {}));
    const r = await pedir({ ruta: '/api/dashboard', esquema });
    expect(renovar).not.toHaveBeenCalled();
    if (!r.ok) expect(r.fallo.codigo).toBe('servidor');
  });
});

describe('la petición repetida es la misma petición', () => {
  it('conserva método y cuerpo', async () => {
    // A retry that lost the body would silently save nothing.
    renovar.mockResolvedValue({ token: 'nuevo', userId: 'u1', email: 'a@b.co' });
    const cuerpos: unknown[] = [];
    let llamadas = 0;
    vi.stubGlobal('fetch', (_u: string, init: RequestInit) => {
      llamadas += 1;
      cuerpos.push(init.body);
      return llamadas === 1
        ? respuesta(401, { ok: false })
        : respuesta(200, { ok: true, data: { id: 'ok' } });
    });

    await pedir({
      ruta: '/api/answers',
      metodo: 'POST',
      cuerpo: { respuesta: 'B' },
      esquema,
    });

    expect(cuerpos).toHaveLength(2);
    expect(cuerpos[1]).toBe(cuerpos[0]);
    expect(cuerpos[1]).toBe(JSON.stringify({ respuesta: 'B' }));
  });
});
