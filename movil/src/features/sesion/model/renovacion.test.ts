import { describe, expect, it } from 'vitest';
import {
  convieneRenovar,
  refreshVencido,
  sesionPerdida,
  vencimientoDelToken,
} from './renovacion';
import type { Sesion } from '@/core/almacenamiento/sesion';

/**
 * The rules that decide whether a learner sees a sign-in screen.
 *
 * This is the logic whose absence was the bug: the app held a token
 * for seven days, never asked for another, and then dropped the
 * learner at the sign-in form with nothing on screen to explain why.
 */

const AHORA = new Date('2026-11-22T12:00:00.000Z');

/** A real JWT shape, so the parser is exercised rather than mocked. */
function jwtQueVence(cuando: Date): string {
  const cabecera = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const carga = btoa(JSON.stringify({ sub: 'u1', exp: Math.floor(cuando.getTime() / 1000) }));
  return `${cabecera}.${carga}.firma-que-no-verificamos`;
}

function sesion(p: Partial<Sesion> = {}): Sesion {
  return {
    token: jwtQueVence(new Date('2026-11-29T12:00:00.000Z')),
    userId: 'u1',
    email: 'a@b.co',
    refreshToken: 'refresh-valido',
    refreshTokenExpiresAt: '2026-12-22T12:00:00.000Z',
    ...p,
  };
}

describe('leer el vencimiento del token', () => {
  it('saca la fecha de un JWT real', () => {
    const cuando = new Date('2026-11-29T12:00:00.000Z');
    expect(vencimientoDelToken(jwtQueVence(cuando))?.toISOString()).toBe(cuando.toISOString());
  });

  it('trata `exp` como segundos, no milisegundos', () => {
    /* Forgetting the multiplication dates every token to 1970 and
       refreshes on every single request. */
    const cuando = new Date('2027-06-01T00:00:00.000Z');
    const leido = vencimientoDelToken(jwtQueVence(cuando));
    expect(leido?.getUTCFullYear()).toBe(2027);
  });

  it('un token que no es JWT da null, no una excepción', () => {
    // The client must not crash on a malformed stored value.
    for (const malo of ['', 'abc', 'a.b', 'a.b.c.d', 'no-base64.{}.x']) {
      expect(() => vencimientoDelToken(malo)).not.toThrow();
      expect(vencimientoDelToken(malo)).toBeNull();
    }
  });

  it('un JWT sin `exp` da null', () => {
    const sinExp = `${btoa('{}')}.${btoa(JSON.stringify({ sub: 'u1' }))}.f`;
    expect(vencimientoDelToken(sinExp)).toBeNull();
  });
});

describe('cuándo conviene renovar', () => {
  it('no renueva un token recién emitido', () => {
    expect(convieneRenovar(sesion(), AHORA)).toBe(false);
  });

  it('renueva cuando falta menos de un día', () => {
    /* The margin is the point: a learner who opens the app on a bus
       with one bar should already carry a token that works. */
    const casiVencido = sesion({
      token: jwtQueVence(new Date('2026-11-22T20:00:00.000Z')),
    });
    expect(convieneRenovar(casiVencido, AHORA)).toBe(true);
  });

  it('sin refresh token no hay nada que renovar', () => {
    // A session stored before refresh existed. It has to keep working,
    // not crash.
    const vieja = sesion({ refreshToken: undefined, refreshTokenExpiresAt: undefined });
    expect(convieneRenovar(vieja, AHORA)).toBe(false);
  });

  it('un refresh token vencido no compra nada', () => {
    const agotada = sesion({
      token: jwtQueVence(new Date('2026-11-22T20:00:00.000Z')),
      refreshTokenExpiresAt: '2026-11-01T00:00:00.000Z',
    });
    expect(convieneRenovar(agotada, AHORA)).toBe(false);
  });

  it('un token ilegible se renueva en vez de confiarse', () => {
    // Being wrong here costs one request. Being wrong the other way
    // costs the learner their session.
    expect(convieneRenovar(sesion({ token: 'no-es-un-jwt' }), AHORA)).toBe(true);
  });
});

describe('cuándo la sesión está perdida', () => {
  it('una sesión sana no está perdida', () => {
    expect(sesionPerdida(sesion(), AHORA)).toBe(false);
  });

  it('token vencido con refresh válido no está perdida', () => {
    /* This is the case the whole feature exists for: before, this was
       indistinguishable from being signed out. */
    const vencida = sesion({ token: jwtQueVence(new Date('2026-11-20T12:00:00.000Z')) });
    expect(sesionPerdida(vencida, AHORA)).toBe(false);
  });

  it('token vencido sin refresh sí está perdida', () => {
    const vencida = sesion({
      token: jwtQueVence(new Date('2026-11-20T12:00:00.000Z')),
      refreshToken: undefined,
    });
    expect(sesionPerdida(vencida, AHORA)).toBe(true);
  });

  it('todo vencido está perdida', () => {
    const todo = sesion({
      token: jwtQueVence(new Date('2026-11-20T12:00:00.000Z')),
      refreshTokenExpiresAt: '2026-11-21T00:00:00.000Z',
    });
    expect(sesionPerdida(todo, AHORA)).toBe(true);
  });

  it('un token ilegible no se declara perdido', () => {
    // We do not know when it expires, so the server decides — not us,
    // and not by showing a sign-in form.
    expect(sesionPerdida(sesion({ token: 'ilegible' }), AHORA)).toBe(false);
  });
});

describe('el vencimiento del refresh token', () => {
  it('una fecha inválida no se trata como vencida', () => {
    // A corrupt stored value must not sign the learner out.
    expect(refreshVencido(sesion({ refreshTokenExpiresAt: 'basura' }), AHORA)).toBe(false);
  });

  it('sin fecha, se asume vigente y el servidor decide', () => {
    expect(refreshVencido(sesion({ refreshTokenExpiresAt: undefined }), AHORA)).toBe(false);
  });
});
