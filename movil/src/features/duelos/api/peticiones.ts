import { z } from 'zod';
import { pedir } from '@/core/http/cliente';
import {
  denunciaRecibida,
  entregaHecha,
  estadoDeAmistad,
  misAmigos,
  perfilDeAmigo,
  estadoDeBloqueo,
  listaDeBloqueados,
  listaDeDuelos,
  perfilDeDuelos,
  preguntasDeDuelo,
  resultadoBusqueda,
  retoCreado,
  type MotivoDenuncia,
} from './esquemas';

export function leerPerfilDeDuelos() {
  return pedir({ ruta: '/api/duelos/perfil', esquema: perfilDeDuelos });
}

export function ponerAlias(alias: string) {
  return pedir({
    ruta: '/api/duelos/alias',
    metodo: 'POST',
    cuerpo: { alias },
    esquema: perfilDeDuelos,
  });
}

export function cambiarBuscable(buscable: boolean) {
  return pedir({
    ruta: '/api/duelos/buscable',
    metodo: 'POST',
    cuerpo: { buscable },
    esquema: perfilDeDuelos,
  });
}

/**
 * Declares that a guardian authorised the account.
 *
 * Required by Ley 1581 de 2012 before this learner can be found by
 * others or challenge anyone. Everything else in the app works
 * without it.
 */
export function declararAutorizacionDeTutor() {
  return pedir({
    ruta: '/api/duelos/autorizacion-tutor',
    metodo: 'POST',
    cuerpo: {},
    esquema: perfilDeDuelos,
  });
}

export function buscarJugadores(termino: string) {
  return pedir({
    ruta: `/api/duelos/buscar?q=${encodeURIComponent(termino)}`,
    esquema: resultadoBusqueda,
  });
}

export function retar(rivalId: string) {
  return pedir({
    ruta: '/api/duelos/retar',
    metodo: 'POST',
    cuerpo: { rivalId },
    esquema: retoCreado,
  });
}

export function leerMisDuelos() {
  return pedir({ ruta: '/api/duelos', esquema: listaDeDuelos });
}

export function aceptarDuelo(id: string) {
  return pedir({
    ruta: `/api/duelos/${id}/aceptar`,
    metodo: 'POST',
    cuerpo: {},
    esquema: estadoDeBloqueo.partial().passthrough(),
  });
}

export function rechazarDuelo(id: string) {
  return pedir({
    ruta: `/api/duelos/${id}/rechazar`,
    metodo: 'POST',
    cuerpo: {},
    esquema: estadoDeBloqueo.partial().passthrough(),
  });
}

export function leerPreguntasDeDuelo(id: string) {
  return pedir({ ruta: `/api/duelos/${id}/preguntas`, esquema: preguntasDeDuelo });
}

export function entregarDuelo(params: {
  id: string;
  respuestas: ReadonlyArray<{ itemId: string; eleccion: string }>;
  segundos: number;
}) {
  return pedir({
    ruta: `/api/duelos/${params.id}/entregar`,
    metodo: 'POST',
    cuerpo: { respuestas: params.respuestas, segundos: params.segundos },
    esquema: entregaHecha,
  });
}

export function leerBloqueados() {
  return pedir({ ruta: '/api/duelos/bloqueados', esquema: listaDeBloqueados });
}

export function bloquearJugador(id: string) {
  return pedir({
    ruta: `/api/duelos/bloquear/${id}`,
    metodo: 'POST',
    cuerpo: {},
    esquema: estadoDeBloqueo,
  });
}

export function desbloquearJugador(id: string) {
  return pedir({
    ruta: `/api/duelos/bloquear/${id}`,
    metodo: 'DELETE',
    esquema: estadoDeBloqueo,
  });
}

/** Reports a learner. The server blocks them at the same time. */
export function denunciarJugador(params: {
  denunciadoId: string;
  motivo: MotivoDenuncia;
  detalle?: string;
}) {
  return pedir({
    ruta: '/api/duelos/denunciar',
    metodo: 'POST',
    cuerpo: params,
    esquema: denunciaRecibida,
  });
}

/** Someone else's profile. Only answers between accepted friends. */
export function leerPerfilDeAmigo(usuarioId: string) {
  return pedir({
    ruta: `/api/duelos/amigos/${usuarioId}/perfil`,
    esquema: perfilDeAmigo,
  });
}

/** Writes or clears the learner's own one-line description. */
export function ponerDescripcion(descripcion: string) {
  return pedir({
    ruta: '/api/duelos/descripcion',
    metodo: 'POST',
    cuerpo: { descripcion },
    esquema: z.object({ descripcion: z.string().nullable() }),
  });
}

export function leerAmigos() {
  return pedir({ ruta: '/api/duelos/amigos', esquema: misAmigos });
}

export function pedirAmistad(usuarioId: string) {
  return pedir({
    ruta: `/api/duelos/amigos/${usuarioId}`,
    metodo: 'POST',
    cuerpo: {},
    esquema: estadoDeAmistad,
  });
}

export function responderAmistad(params: { id: string; acepta: boolean }) {
  return pedir({
    ruta: `/api/duelos/amigos/solicitud/${params.id}/${params.acepta ? 'aceptar' : 'rechazar'}`,
    metodo: 'POST',
    cuerpo: {},
    esquema: estadoDeAmistad,
  });
}

export function quitarAmigo(usuarioId: string) {
  return pedir({
    ruta: `/api/duelos/amigos/${usuarioId}`,
    metodo: 'DELETE',
    esquema: estadoDeAmistad,
  });
}
