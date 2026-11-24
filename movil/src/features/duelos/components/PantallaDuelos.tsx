import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Boton } from '@/shared/ui/Boton';
import { Aviso } from '@/shared/ui/Aviso';
import { EsqueletoLista } from '@/shared/ui/Esqueleto';
import { useAmigos, useBuscarJugadores, useMisDuelos, useModeracion, usePerfilDeDuelos } from '../hooks/useDuelos';
import { ModalDenuncia } from './ModalDenuncia';
import type { Duelo } from '../api/esquemas';

/**
 * Duels: what is waiting, and how to start one.
 *
 * Opens on what needs an answer, not on a search box. A learner with a
 * pending challenge should see it before anything else; one with none
 * is the only one who needs the search.
 */
export function PantallaDuelos({
  onJugar,
  onAjustes,
}: {
  onJugar: (dueloId: string, contra: string, rivalId: string | null) => void;
  onAjustes: () => void;
}) {
  const { perfil, cargando: cargandoPerfil } = usePerfilDeDuelos();
  const duelos = useMisDuelos();
  const moderacion = useModeracion();
  const amigos = useAmigos();
  /* Who is being reported, or null. Held here rather than in each row
     so only one modal can be open. */
  const [denunciando, setDenunciando] = useState<{ id: string; alias: string } | null>(null);

  if (cargandoPerfil || duelos.cargando) {
    return (
      <View className="flex-1 px-5 py-6">
        <EsqueletoLista filas={4} />
      </View>
    );
  }

  /* The gate comes first and explains itself. A learner who taps
     "Retar" and gets an error has learned nothing; one who reads why
     can go fix it. */
  if (perfil && !perfil.visible) {
    return <Puerta perfil={perfil} onAjustes={onAjustes} />;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-6 px-5 py-6"
      refreshControl={
        <RefreshControl refreshing={duelos.recargando} onRefresh={duelos.recargar} />
      }
    >
      {duelos.fallo ? (
        <Aviso mensaje="No pudimos cargar sus duelos" detalle={duelos.fallo.mensaje} />
      ) : null}

      {duelos.porAceptar.length > 0 ? (
        <Seccion titulo="Lo están esperando">
          {duelos.porAceptar.map((d) => (
            <Invitacion
              key={d.id}
              duelo={d}
              respondiendo={duelos.respondiendo}
              onAceptar={async () => {
                await duelos.aceptar(d.id);
                onJugar(d.id, d.contra?.alias ?? 'su rival', d.contra?.id ?? null);
              }}
              onRechazar={() => void duelos.rechazar(d.id)}
              onDenunciar={
                d.contra
                  ? () => setDenunciando({ id: d.contra!.id, alias: d.contra!.alias ?? 'esta persona' })
                  : undefined
              }
              onBloquear={
                d.contra ? () => void moderacion.bloquear(d.contra!.id) : undefined
              }
            />
          ))}
        </Seccion>
      ) : null}

      {duelos.enCurso.length > 0 ? (
        <Seccion titulo="Su turno">
          {duelos.enCurso.map((d) => (
            <Fila key={d.id} duelo={d}>
              {d.miMarcador ? (
                <Text className="text-[13px] text-slate-500">
                  Entregado. Falta {d.contra?.alias ?? 'su rival'}.
                </Text>
              ) : (
                <Boton
                  tamano="medio"
                  onPress={() => onJugar(d.id, d.contra?.alias ?? 'su rival', d.contra?.id ?? null)}
                >
                  Jugar
                </Boton>
              )}
            </Fila>
          ))}
        </Seccion>
      ) : null}

      {amigos.porResponder.length > 0 ? (
        <Seccion titulo="Te quieren agregar">
          {amigos.porResponder.map((a) => (
            <View
              key={a.id}
              className="flex-row items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
              <Text className="text-[15px] font-semibold text-slate-800">
                {a.amigo.alias}
              </Text>
              <View className="flex-row gap-2">
                <Boton
                  tamano="medio"
                  variante="suave"
                  deshabilitado={amigos.respondiendo}
                  onPress={() => void amigos.responder({ id: a.id, acepta: true })}
                >
                  Aceptar
                </Boton>
                <Pressable
                  onPress={() => void amigos.responder({ id: a.id, acepta: false })}
                  accessibilityRole="button"
                  className="justify-center px-2"
                >
                  <Text className="text-[13px] text-slate-500">No</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </Seccion>
      ) : null}

      {/* Friends above the search box, because the common case is
          duelling the same three classmates. Typing an alias every
          time is friction with no purpose. */}
      {amigos.amigos.length > 0 ? (
        <Seccion titulo="Tus amigos">
          {amigos.amigos.map((a) => (
            <View
              key={a.id}
              className="flex-row items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
              <Text className="text-[15px] font-semibold text-slate-800">
                {a.amigo.alias}
              </Text>
              <Boton
                tamano="medio"
                variante="suave"
                deshabilitado={duelos.retando}
                onPress={() => void duelos.retar(a.amigo.id)}
              >
                Retar
              </Boton>
            </View>
          ))}
        </Seccion>
      ) : null}

      <Buscador
        onRetar={duelos.retar}
        retando={duelos.retando}
        fallo={duelos.falloAlRetar}
        onAgregar={amigos.pedir}
        agregando={amigos.pidiendo}
      />

      {duelos.enviados.length > 0 ? (
        <Seccion titulo="Retos que envió">
          {duelos.enviados.map((d) => (
            <Fila key={d.id} duelo={d}>
              <Text className="text-[13px] text-slate-500">Sin responder todavía</Text>
            </Fila>
          ))}
        </Seccion>
      ) : null}

      {duelos.terminados.length > 0 ? (
        <Seccion titulo="Terminados">
          {duelos.terminados.map((d) => (
            <Fila key={d.id} duelo={d}>
              <Text
                className={`text-[13px] font-semibold ${
                  d.gane === null
                    ? 'text-slate-500'
                    : d.gane
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                }`}
              >
                {d.gane === null ? 'Empate' : d.gane ? 'Ganó' : 'Perdió'}
                {d.miMarcador && d.marcadorDelOtro
                  ? ` ${d.miMarcador.aciertos}–${d.marcadorDelOtro.aciertos}`
                  : ''}
              </Text>
            </Fila>
          ))}
        </Seccion>
      ) : null}

      <Pressable onPress={onAjustes} className="py-2">
        <Text className="text-center text-[13px] text-brand-bright">
          Mi nombre, privacidad y bloqueados
        </Text>
      </Pressable>

      {denunciando ? (
        <ModalDenuncia
          visible
          jugadorId={denunciando.id}
          alias={denunciando.alias}
          onCerrar={() => setDenunciando(null)}
        />
      ) : null}
    </ScrollView>
  );
}

/**
 * What stands between a learner and duels, said plainly.
 *
 * Two different reasons, and they are not interchangeable: one needs a
 * guardian's authorisation, the other needs a name. Telling someone
 * "no puede retar" without which one would leave them stuck.
 */
function Puerta({
  perfil,
  onAjustes,
}: {
  perfil: { alias: string | null; tutorAutorizoEn: string | null };
  onAjustes: () => void;
}) {
  const faltaAutorizacion = perfil.tutorAutorizoEn === null;

  return (
    <View className="flex-1 justify-center gap-5 px-5">
      <Text className="text-[22px] font-bold text-slate-900">Duelos</Text>
      <Text className="text-[15px] leading-6 text-slate-600">
        Rete a un compañero: los dos resuelven las mismas 5 preguntas cuando puedan. Gana quien
        acierte más.
      </Text>

      {faltaAutorizacion ? (
        <Aviso
          tono="aviso"
          mensaje="Falta la autorización de su acudiente"
          detalle="Para que otros lo encuentren y usted pueda retarlos, su papá, mamá o acudiente tiene que autorizarlo. Todo lo demás de la app funciona sin esto."
        />
      ) : (
        <Aviso
          tono="aviso"
          mensaje="Escoja un nombre"
          detalle="Es el nombre con el que sus compañeros lo encuentran. No use su nombre completo."
        />
      )}

      <Boton onPress={onAjustes}>{faltaAutorizacion ? 'Ir a autorizar' : 'Escoger nombre'}</Boton>
    </View>
  );
}

/** Finding someone to challenge. */
function Buscador({
  onRetar,
  retando,
  fallo,
  onAgregar,
  agregando,
}: {
  onRetar: (rivalId: string) => Promise<unknown>;
  retando: boolean;
  fallo: { mensaje: string } | null;
  onAgregar: (usuarioId: string) => Promise<unknown>;
  agregando: boolean;
}) {
  const busqueda = useBuscarJugadores();
  const [retado, setRetado] = useState<string | null>(null);
  const [agregado, setAgregado] = useState<string | null>(null);

  return (
    <Seccion titulo="Retar a alguien">
      <TextInput
        value={busqueda.termino}
        onChangeText={busqueda.setTermino}
        placeholder="Nombre de su compañero"
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-xl border border-slate-300 px-4 py-3 text-[15px] text-slate-900"
      />

      {fallo ? <Aviso mensaje={fallo.mensaje} /> : null}

      {busqueda.termino.trim().length >= 2 && busqueda.resultados.length === 0 && !busqueda.buscando ? (
        <Text className="text-[13px] text-slate-500">
          Nadie con ese nombre. Pregúntele cómo se llama en la app.
        </Text>
      ) : null}

      {busqueda.resultados.map((j) => (
        <View
          key={j.id}
          className="flex-row items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
        >
          <Text className="text-[15px] font-semibold text-slate-800">{j.alias}</Text>
          <View className="flex-row items-center gap-3">
            {/* Adding is offered beside challenging, because after
                one duel with someone you will want the second
                without typing their name again. */}
            {agregado === j.id ? (
              <Text className="text-[13px] text-slate-500">Pedido</Text>
            ) : (
              <Pressable
                disabled={agregando}
                onPress={async () => {
                  const r = await onAgregar(j.id).catch(() => null);
                  if (r) setAgregado(j.id);
                }}
                accessibilityRole="button"
              >
                <Text className="text-[13px] text-brand-bright">Agregar</Text>
              </Pressable>
            )}

            {retado === j.id ? (
              <Text className="text-[13px] text-emerald-700">Reto enviado</Text>
            ) : (
              <Boton
                tamano="medio"
                variante="suave"
                deshabilitado={retando}
                onPress={async () => {
                  const r = await onRetar(j.id).catch(() => null);
                  if (r) setRetado(j.id);
                }}
              >
                Retar
              </Boton>
            )}
          </View>
        </View>
      ))}
    </Seccion>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function Fila({ duelo, children }: { duelo: Duelo; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <Text className="text-[15px] font-semibold text-slate-800">
        {duelo.contra?.alias ?? 'Rival'}
      </Text>
      {children}
    </View>
  );
}

/**
 * An invitation, with the two ways out of it.
 *
 * Blocking and reporting are here and not only in settings. An
 * unwanted challenge is where harassment actually arrives, and a
 * report button a learner has to go hunting for in a settings screen
 * is one they will not find at the moment they need it.
 */
function Invitacion({
  duelo,
  respondiendo,
  onAceptar,
  onRechazar,
  onBloquear,
  onDenunciar,
}: {
  duelo: Duelo;
  respondiendo: boolean;
  onAceptar: () => void;
  onRechazar: () => void;
  onBloquear?: () => void;
  onDenunciar?: () => void;
}) {
  return (
    <View className="gap-3 rounded-xl border border-brand-bright/30 bg-brand-bright/5 px-4 py-3">
      <Text className="text-[15px] font-semibold text-slate-900">
        {duelo.contra?.alias ?? 'Alguien'} lo retó
      </Text>
      <Text className="text-[13px] text-slate-600">5 preguntas. Juegue cuando pueda.</Text>
      <View className="flex-row gap-2">
        <Boton tamano="medio" deshabilitado={respondiendo} onPress={onAceptar}>
          Aceptar
        </Boton>
        <Boton tamano="medio" variante="contorno" deshabilitado={respondiendo} onPress={onRechazar}>
          No, gracias
        </Boton>
      </View>
      {onBloquear || onDenunciar ? (
        <View className="flex-row gap-5 pt-1">
          {onBloquear ? (
            <Pressable onPress={onBloquear} accessibilityRole="button">
              <Text className="text-[12px] text-slate-500">Bloquear</Text>
            </Pressable>
          ) : null}
          {onDenunciar ? (
            <Pressable onPress={onDenunciar} accessibilityRole="button">
              <Text className="text-[12px] text-slate-500">Denunciar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
