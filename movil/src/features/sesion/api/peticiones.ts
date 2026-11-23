import { pedir } from '@/core/http/cliente';
import { respuestaAuth } from './esquemas';

/**
 * Auth calls. Public: they are how a session begins, so they send no
 * token and must not fail for the lack of one.
 */

export function entrar(email: string, password: string) {
  return pedir({
    ruta: '/api/auth/login',
    metodo: 'POST',
    cuerpo: { email, password },
    esquema: respuestaAuth,
    conSesion: false,
  });
}

export function registrar(params: {
  email: string;
  password: string;
  nombre?: string;
}) {
  return pedir({
    ruta: '/api/auth/register',
    metodo: 'POST',
    cuerpo: params,
    esquema: respuestaAuth,
    conSesion: false,
  });
}

/**
 * Trade a refresh token for a new access token.
 *
 * Public like the others: the access token it carries may well be the
 * expired one, and sending it would only invite a 401 from the very
 * call meant to fix that.
 */
export function renovar(refreshToken: string) {
  return pedir({
    ruta: '/api/auth/refresh',
    metodo: 'POST',
    cuerpo: { refreshToken },
    esquema: respuestaAuth,
    conSesion: false,
  });
}
