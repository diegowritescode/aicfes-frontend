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
