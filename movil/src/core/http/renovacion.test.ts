import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Renewing once, for everyone waiting.
 *
 * The failure this prevents is subtle and ends with the learner signed
 * out. The dashboard fires several requests at once; if the access
 * token has expired they all get a 401 together. The server rotates
 * the refresh token on use, so a second renewal spends a token the
 * first reply already invalidated — and the mechanism meant to keep
 * the session alive is what kills it.
 */

const leer = vi.fn();
const guardar = vi.fn();
const borrar = vi.fn();

vi.mock('@/core/almacenamiento/sesion', () => ({
  almacenSesion: {
    leer: () => leer(),
    guardar: (s: unknown) => guardar(s),
    borrar: () => borrar(),
  },
}));

const { registrarRenovador, renovarSesion, reiniciarRenovacion } = await import(
  './renovacion'
);

const SESION = {
  token: 'viejo',
  userId: 'u1',
  email: 'a@b.co',
  refreshToken: 'refresh-1',
};

const NUEVA = { ...SESION, token: 'nuevo', refreshToken: 'refresh-2' };

beforeEach(() => {
  leer.mockReset();
  guardar.mockReset();
  borrar.mockReset();
  reiniciarRenovacion();
});

describe('una sola renovación a la vez', () => {
  it('tres llamadas simultáneas gastan el refresh token una vez', async () => {
    /* This is the whole point. Without sharing, the second renewal
       would present a token the first one already rotated away. */
    leer.mockResolvedValue(SESION);
    const renovador = vi.fn().mockImplementation(
      () => new Promise((r) => setTimeout(() => r(NUEVA), 10)),
    );
    registrarRenovador(renovador);

    const [a, b, c] = await Promise.all([
      renovarSesion(),
      renovarSesion(),
      renovarSesion(),
    ]);

    expect(renovador).toHaveBeenCalledTimes(1);
    expect(a).toEqual(NUEVA);
    expect(b).toEqual(NUEVA);
    expect(c).toEqual(NUEVA);
  });

  it('una renovación posterior sí vuelve a pedir', async () => {
    // The lock is per attempt, not forever: a token renewed today
    // expires again next week.
    leer.mockResolvedValue(SESION);
    const renovador = vi.fn().mockResolvedValue(NUEVA);
    registrarRenovador(renovador);

    await renovarSesion();
    await renovarSesion();

    expect(renovador).toHaveBeenCalledTimes(2);
  });
});

describe('cuándo devuelve null', () => {
  it('sin refresh token guardado', async () => {
    leer.mockResolvedValue({ ...SESION, refreshToken: undefined });
    registrarRenovador(vi.fn());
    expect(await renovarSesion()).toBeNull();
  });

  it('sin sesión guardada', async () => {
    leer.mockResolvedValue(null);
    registrarRenovador(vi.fn());
    expect(await renovarSesion()).toBeNull();
  });

  it('si el servidor rechaza el refresh token, borra la sesión', async () => {
    /* Leaving a dead session in the store means every later request
       retries this and fails the same way. */
    leer.mockResolvedValue(SESION);
    registrarRenovador(vi.fn().mockResolvedValue(null));

    expect(await renovarSesion()).toBeNull();
    expect(borrar).toHaveBeenCalledTimes(1);
  });

  it('una excepción no se propaga al pedido que la disparó', async () => {
    // That request has its own failure to report; a throw from here
    // would replace it with something the screen cannot explain.
    leer.mockResolvedValue(SESION);
    registrarRenovador(vi.fn().mockRejectedValue(new Error('red caída')));

    await expect(renovarSesion()).resolves.toBeNull();
  });

  it('tras un fallo, el siguiente intento no queda bloqueado', async () => {
    leer.mockResolvedValue(SESION);
    const renovador = vi
      .fn()
      .mockRejectedValueOnce(new Error('red caída'))
      .mockResolvedValueOnce(NUEVA);
    registrarRenovador(renovador);

    expect(await renovarSesion()).toBeNull();
    expect(await renovarSesion()).toEqual(NUEVA);
  });
});

describe('la sesión renovada se guarda', () => {
  it('guarda lo que devolvió el servidor, no lo que teníamos', async () => {
    // Including the rotated refresh token: keeping the old one would
    // make the next renewal fail.
    leer.mockResolvedValue(SESION);
    registrarRenovador(vi.fn().mockResolvedValue(NUEVA));

    await renovarSesion();

    expect(guardar).toHaveBeenCalledWith(NUEVA);
  });
});
