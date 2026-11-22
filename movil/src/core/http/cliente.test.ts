import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * The client is the only place that talks to the server, so these are
 * the rules the whole app inherits.
 *
 * What is pinned here is what the old client got wrong by not having
 * anywhere to put it: a failure that cannot be told apart from another
 * failure, a response shape nobody checked, and a request with no
 * deadline on a phone with one bar.
 */

vi.mock('@/core/config/entorno', () => ({
  entorno: { apiUrl: 'https://api.test', esProduccion: true },
}));

const leer = vi.fn();
vi.mock('@/core/almacenamiento/sesion', () => ({
  almacenSesion: { leer: () => leer() },
}));

const { pedir } = await import('./cliente');
const { z } = await import('zod');

const esquema = z.object({ id: z.string(), total: z.number() });

function responder(cuerpo: unknown, estado = 200) {
  return Promise.resolve({
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: () => Promise.resolve(cuerpo),
  } as Response);
}

beforeEach(() => {
  leer.mockReset();
  leer.mockResolvedValue(null);
  vi.unstubAllGlobals();
});

describe('respuestas correctas', () => {
  it('desenvuelve {ok, data} y valida la forma', async () => {
    vi.stubGlobal('fetch', () => responder({ ok: true, data: { id: 'a', total: 3 } }));
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.datos).toEqual({ id: 'a', total: 3 });
  });

  it('también desenvuelve {items}, que es la otra forma del API', async () => {
    const lista = z.array(z.string());
    vi.stubGlobal('fetch', () => responder({ ok: true, items: ['a', 'b'] }));
    const r = await pedir({ ruta: '/x', esquema: lista });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.datos).toEqual(['a', 'b']);
  });

  it('acepta campos nuevos que el cliente todavía no usa', async () => {
    // The backend evolves. A field added server-side must not break a
    // client that does not read it yet.
    vi.stubGlobal('fetch', () =>
      responder({ ok: true, data: { id: 'a', total: 3, nuevoCampo: 'x' } }),
    );
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(true);
  });
});

describe('una forma inesperada se detiene en la frontera', () => {
  it('un campo con el tipo cambiado falla aquí, no tres pantallas después', async () => {
    // This is the whole point of validating: `total` arriving as a
    // string used to surface as NaN in a progress bar, far from the
    // call that caused it.
    vi.stubGlobal('fetch', () => responder({ ok: true, data: { id: 'a', total: '3' } }));
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fallo.codigo).toBe('respuesta_invalida');
  });

  it('un cuerpo que no es JSON no revienta', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Unexpected token <')),
      } as unknown as Response),
    );
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fallo.codigo).toBe('respuesta_invalida');
  });
});

describe('los fallos se distinguen entre sí', () => {
  it('401 es sesión expirada, no "algo salió mal"', async () => {
    vi.stubGlobal('fetch', () => responder({ ok: false }, 401));
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fallo.codigo).toBe('sin_sesion');
  });

  it('429 es la cuota, y conserva el mensaje del servidor', async () => {
    // "Puede pedir hasta 12" is more useful than our generic line, and
    // it is written for learners too.
    vi.stubGlobal('fetch', () =>
      responder(
        { ok: false, error: { code: 'CUOTA_AGOTADA', message: 'Puede pedir hasta 12.' } },
        429,
      ),
    );
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fallo.codigo).toBe('sin_cuota');
      expect(r.fallo.mensaje).toBe('Puede pedir hasta 12.');
      expect(r.fallo.codigoApi).toBe('CUOTA_AGOTADA');
    }
  });

  it('500 es del servidor', async () => {
    vi.stubGlobal('fetch', () => responder({}, 500));
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fallo.codigo).toBe('servidor');
  });

  it('la red caída es su propio caso', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Network request failed')));
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fallo.codigo).toBe('sin_red');
  });

  it('el tiempo agotado no se confunde con la red caída', async () => {
    // Different advice: one says check your connection, the other says
    // try again. Reporting both as "sin conexión" sends the learner to
    // fix something that is not broken.
    const abortar = Object.assign(new Error('abortado'), { name: 'AbortError' });
    vi.stubGlobal('fetch', () => Promise.reject(abortar));
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fallo.codigo).toBe('tiempo_agotado');
  });

  it('un 200 con ok:false sigue siendo un fallo', async () => {
    // The API answers some errors with a 200 and ok:false. Trusting
    // the status alone would hand the screen an empty success.
    vi.stubGlobal('fetch', () =>
      responder({ ok: false, error: { code: 'X', message: 'No se pudo.' } }, 200),
    );
    const r = await pedir({ ruta: '/x', esquema });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fallo.mensaje).toBe('No se pudo.');
  });
});

describe('la sesión', () => {
  it('se adjunta cuando existe', async () => {
    leer.mockResolvedValue({ token: 'tok-123', userId: 'u1', email: 'a@b.c' });
    let cabeceras: Record<string, string> = {};
    vi.stubGlobal('fetch', (_u: string, init: RequestInit) => {
      cabeceras = init.headers as Record<string, string>;
      return responder({ ok: true, data: { id: 'a', total: 1 } });
    });
    await pedir({ ruta: '/x', esquema });
    expect(cabeceras.Authorization).toBe('Bearer tok-123');
  });

  it('no se adjunta en las rutas públicas', async () => {
    // Sign-in is how a session begins. Sending a stale token to it is
    // how a login fails for someone whose session just expired.
    leer.mockResolvedValue({ token: 'viejo', userId: 'u1', email: 'a@b.c' });
    let cabeceras: Record<string, string> = {};
    vi.stubGlobal('fetch', (_u: string, init: RequestInit) => {
      cabeceras = init.headers as Record<string, string>;
      return responder({ ok: true, data: { id: 'a', total: 1 } });
    });
    await pedir({ ruta: '/api/auth/login', esquema, conSesion: false });
    expect(cabeceras.Authorization).toBeUndefined();
  });
});
